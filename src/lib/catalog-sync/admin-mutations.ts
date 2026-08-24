import "server-only";

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { compensateUploadedCatalogImages } from "@/lib/catalog-sync/create-compensation";
import { planCatalogCreateCommand } from "@/lib/catalog-sync/create-command";
import {
  CatalogSyncError,
  type CatalogSyncState,
} from "@/lib/catalog-sync/model";
import { readVariantImageFiles } from "@/lib/catalog-sync/input-validation";
import { revalidateProducts } from "@/lib/catalog-sync/revalidate";
import { createCatalogSyncManager } from "@/lib/catalog-sync/service";
import { shouldCompensateRejectedPreparedUpload } from "@/lib/catalog-sync/preparation-state";
import {
  commandIdSchema,
  parseVariants,
  productFormSchema,
  productIdSchema,
} from "@/lib/catalog-sync/admin-input";
import {
  buildVariants,
  deleteImage,
  publicImageUrl,
  randomStoragePath,
  uploadImage,
} from "@/lib/catalog-sync/admin-storage";
import {
  domainError,
  pending,
  queued,
  validation,
} from "@/lib/catalog-sync/admin-response";
import type { UserPrincipal } from "@/lib/identity";

type DurableCatalogMutation = {
  operationId: string;
  state: CatalogSyncState;
};

async function finalizeCatalogMutation(input: {
  manager: ReturnType<typeof createCatalogSyncManager>;
  operationId: string;
  productId: number;
  revalidateBeforeProcess?: boolean;
  recordState: (state: DurableCatalogMutation) => void;
  success: () => Promise<NextResponse> | NextResponse;
}) {
  if (input.revalidateBeforeProcess) {
    await revalidateProducts(input.productId);
  }
  const sync = await input.manager.processOperation(input.operationId);
  input.recordState({ operationId: sync.operationId, state: sync.state });
  if (sync.outcome !== "succeeded") return pending(sync);
  await revalidateProducts(input.productId);
  return input.success();
}

export async function createCatalogProduct(
  request: NextRequest,
  principal: UserPrincipal,
) {
  const manager = createCatalogSyncManager(principal);
  let durable: DurableCatalogMutation | null = null;
  let preparationWorkerId: string | null = null;
  try {
    const form = await request.formData();
    const product = productFormSchema.parse({
      name: form.get("name"),
      description: form.get("description"),
      price: form.get("price"),
      category: form.get("category"),
    });
    const commandId = commandIdSchema.parse(form.get("commandId"));
    const mainImage = form.get("mainImage");
    if (!(mainImage instanceof File) || !mainImage.size) {
      throw new CatalogSyncError("invalid_target", "Main image is required");
    }
    const variantsInput = parseVariants(form.get("variants"));
    const planned = await planCatalogCreateCommand({
      commandId,
      product,
      mainImage,
      variants: variantsInput.map((variant, variantIndex) => ({
        id: variant.id,
        color: variant.color,
        sizes: variant.sizes,
        files: readVariantImageFiles(
          form,
          variantIndex,
          variant.imageCount ?? 0,
        ),
      })),
      publicUrlForPath: publicImageUrl,
    });
    let operation = await manager.prepareCreate({
      operationId: commandId,
      requestHash: planned.requestHash,
      product: planned.product,
      variants: planned.variants,
      uploadedImageUrls: planned.uploads.map((upload) => upload.url),
    });
    durable = { operationId: operation.id, state: operation.state };

    if (operation.state === "preparing") {
      preparationWorkerId = randomUUID();
      const claimed = await manager.claimPreparedCreate(
        operation.id,
        preparationWorkerId,
      );
      if (!claimed) {
        return queued(
          operation.id,
          operation.state,
          "Catalog creation is already uploading in another request",
        );
      }
      operation = claimed;
      durable = { operationId: operation.id, state: operation.state };
      if (
        operation.state === "preparing" &&
        operation.target.kind === "preparing"
      ) {
        const completedImages = new Set(
          operation.target.completedImageUrls ?? [],
        );
        for (const upload of planned.uploads) {
          if (completedImages.has(upload.url)) continue;
          const url = await uploadImage(upload.file, upload.path, true);
          if (!url) {
            throw new Error("Error uploading catalog image");
          }
          try {
            operation = await manager.recordPreparedUpload(
              operation.id,
              url,
              preparationWorkerId,
            );
            completedImages.add(url);
          } catch (recordError) {
            const current = await manager
              .getOperation(operation.id)
              .catch(() => null);
            if (shouldCompensateRejectedPreparedUpload(current?.state)) {
              try {
                await deleteImage(url);
              } catch (cleanupError) {
                try {
                  await manager.recordPreparedCleanupFailure(
                    operation.id,
                    cleanupError,
                  );
                } catch (recordCleanupError) {
                  throw new AggregateError(
                    [recordError, cleanupError, recordCleanupError],
                    "Catalog upload cleanup failed and could not be recorded",
                  );
                }
                throw new AggregateError(
                  [recordError, cleanupError],
                  "Catalog upload cleanup failed and was scheduled for retry",
                );
              }
            }
            throw recordError;
          }
        }
        operation = await manager.activatePreparedCreate(
          operation.id,
          preparationWorkerId,
        );
      } else {
        preparationWorkerId = null;
      }
      durable = { operationId: operation.id, state: operation.state };
    }

    if (operation.state === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Catalog creation was cancelled after upload recovery",
          operationId: operation.id,
          syncState: operation.state,
          retryable: false,
        },
        { status: 409 },
      );
    }

    if (operation.state === "succeeded") {
      await revalidateProducts(operation.productId);
      return NextResponse.json({
        success: true,
        message: "Product created successfully",
        data: await manager.findByIdIncludingArchived(operation.productId),
        operationId: operation.id,
      });
    }

    return finalizeCatalogMutation({
      manager,
      operationId: operation.id,
      productId: operation.productId,
      recordState: (state) => {
        durable = state;
      },
      success: async () => NextResponse.json({
        success: true,
        message: "Product created successfully",
        data: await manager.findByIdIncludingArchived(operation.productId),
        operationId: operation.id,
      }),
    });
  } catch (error) {
    if (durable?.state === "preparing" && preparationWorkerId) {
      try {
        await manager.releasePreparedCreate(
          durable.operationId,
          preparationWorkerId,
          error,
        );
      } catch (releaseError) {
        console.error("Error releasing catalog preparation lease", releaseError);
      }
    }
    if (error instanceof z.ZodError) return validation(error);
    if (
      error instanceof CatalogSyncError &&
      durable?.state === "preparing" &&
      error.code === "conflict"
    ) {
      return queued(
        durable.operationId,
        durable.state,
        "Catalog creation is already being recovered. Retry the same command shortly.",
      );
    }
    if (error instanceof CatalogSyncError) {
      return domainError(error, error.code === "conflict" ? false : undefined);
    }
    console.error("Error creating product", error);
    if (durable && durable.state !== "succeeded") {
      return queued(
        durable.operationId,
        durable.state,
        "Catalog creation has been recorded. Submit the same form again to continue synchronization.",
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function updateCatalogProduct(
  request: NextRequest,
  principal: UserPrincipal,
) {
  const manager = createCatalogSyncManager(principal);
  const uploads: string[] = [];
  let durable: DurableCatalogMutation | null = null;
  try {
    const form = await request.formData();
    const id = productIdSchema.parse(form.get("id"));
    const restoreArchived = z
      .literal("true")
      .optional()
      .transform((value) => value === "true")
      .parse(form.get("restoreArchived") ?? undefined);
    const product = productFormSchema.parse({
      name: form.get("name"),
      description: form.get("description"),
      price: form.get("price"),
      category: form.get("category"),
    });
    const existing = restoreArchived
      ? await manager.findArchivedByIdForRestoration(id)
      : await manager.findByIdIncludingArchived(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (existing.archivedAt && !restoreArchived) {
      return NextResponse.json(
        {
          error: "Product was archived. Reopen it using the explicit restore action.",
          code: "restore_required",
          retryable: false,
        },
        { status: 409 },
      );
    }
    let img =
      typeof form.get("existingMainImage") === "string" &&
      form.get("existingMainImage")
        ? String(form.get("existingMainImage"))
        : existing.img;
    const main = form.get("mainImage");
    if (main instanceof File && main.size) {
      const uploaded = await uploadImage(
        main,
        randomStoragePath("products/" + id, main),
      );
      if (!uploaded) throw new Error("Error uploading main image");
      img = uploaded;
      uploads.push(uploaded);
    }
    const variants = await buildVariants(
      form,
      parseVariants(form.get("variants")),
      id,
      uploads,
    );
    const operation = await manager.enqueueUpsert({
      productId: id,
      product: { ...product, img },
      variants,
      uploadedImageUrls: uploads,
      createdShell: false,
      restoreArchived,
    });
    durable = { operationId: operation.id, state: operation.state };
    return finalizeCatalogMutation({
      manager,
      operationId: operation.id,
      productId: id,
      revalidateBeforeProcess: true,
      recordState: (state) => {
        durable = state;
      },
      success: async () => NextResponse.json({
        success: true,
        message: "Product updated successfully",
        data: await manager.findByIdIncludingArchived(id),
        operationId: operation.id,
      }),
    });
  } catch (error) {
    if (!durable) {
      try {
        await compensateUploadedCatalogImages({
          originalError: error,
          uploadedImageUrls: uploads,
          deleteImage,
        });
      } catch (compensationError) {
        console.error(
          "Catalog update failed and upload compensation failed",
          compensationError,
        );
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    }
    if (error instanceof z.ZodError) return validation(error);
    if (durable) {
      return queued(
        durable.operationId,
        durable.state,
        "Catalog update has been recorded and will continue asynchronously.",
      );
    }
    if (error instanceof CatalogSyncError) return domainError(error);
    console.error("Error updating product", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function archiveCatalogProduct(
  request: NextRequest,
  principal: UserPrincipal,
) {
  let durable: DurableCatalogMutation | null = null;
  try {
    const id = productIdSchema.parse(request.nextUrl.searchParams.get("id"));
    const manager = createCatalogSyncManager(principal);
    const operation = await manager.enqueueArchive(id);
    durable = { operationId: operation.id, state: operation.state };
    return finalizeCatalogMutation({
      manager,
      operationId: operation.id,
      productId: id,
      revalidateBeforeProcess: true,
      recordState: (state) => {
        durable = state;
      },
      success: () => NextResponse.json({
        success: true,
        message: "Product archived successfully",
        operationId: operation.id,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) return validation(error);
    if (durable) {
      return queued(
        durable.operationId,
        durable.state,
        "Catalog archive has been recorded and will continue asynchronously.",
      );
    }
    if (error instanceof CatalogSyncError) return domainError(error);
    console.error("Error archiving product", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
