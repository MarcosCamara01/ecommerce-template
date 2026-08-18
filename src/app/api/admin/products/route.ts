import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { compensateUploadedCatalogImages } from "@/lib/catalog-sync/create-compensation";
import { planCatalogCreateCommand } from "@/lib/catalog-sync/create-command";
import {
  CatalogSyncError,
  type CatalogVariantDraft,
} from "@/lib/catalog-sync/model";
import { parseCatalogPriceCents } from "@/lib/catalog-sync/money";
import {
  catalogProductNameSchema,
  catalogVariantColorSchema,
  catalogVariantImageCountSchema,
  readVariantImageFiles,
  mergeVariantImageUrls,
} from "@/lib/catalog-sync/input-validation";
import { revalidateProducts } from "@/lib/catalog-sync/revalidate";
import { createCatalogSyncManager } from "@/lib/catalog-sync/service";
import { shouldCompensateRejectedPreparedUpload } from "@/lib/catalog-sync/preparation-state";
import { removeStorageObjectOrThrow } from "@/lib/catalog-sync/storage-compensation";
import { ProductCategoryZod, ProductSizeZod } from "@/lib/db/drizzle/schema";
import {
  IdentityError,
  identityErrorHttpStatus,
  requireCapabilityFromHeaders,
  type UserPrincipal,
} from "@/lib/identity";
import { createStorageAdminClient } from "@/lib/storage/supabase";
import { createCatalogRouteHandler } from "./authorization";

const BUCKET = "product-images";
const productIdSchema = z.coerce.number().int().positive();
const commandIdSchema = z.uuid();
const productFormSchema = z
  .object({
    name: catalogProductNameSchema,
    description: z.string().trim().min(1),
    price: z.string().trim().transform((value, context) => {
      const cents = parseCatalogPriceCents(value);
      if (cents === null) {
        context.addIssue({
          code: "custom",
          message: "Price must be positive and use at most two decimal places",
        });
        return z.NEVER;
      }
      return cents;
    }),
    category: ProductCategoryZod,
  })
  .transform(({ price, ...product }) => ({ ...product, priceCents: price }));
const variantFormSchema = z.object({
  id: z.number().int().positive().optional(),
  color: catalogVariantColorSchema,
  sizes: z.array(ProductSizeZod).min(1),
  imageCount: catalogVariantImageCountSchema.optional(),
  existingImages: z.array(z.string()).optional(),
  removedImages: z.array(z.string()).optional(),
});
type VariantInput = z.infer<typeof variantFormSchema>;

function parseVariants(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    throw new z.ZodError([
      { code: "custom", message: "Variants are required", path: ["variants"] },
    ]);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new z.ZodError([
      { code: "custom", message: "Invalid variants payload", path: ["variants"] },
    ]);
  }
  return z.array(variantFormSchema).min(1).max(50).parse(parsed);
}

const normalizeColor = (color: string) =>
  color
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

function imageExtension(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return extension || "bin";
}

function randomStoragePath(prefix: string, file: File) {
  return prefix + "/" + randomUUID() + "." + imageExtension(file);
}

function publicImageUrl(path: string) {
  return createStorageAdminClient()
    .storage.from(BUCKET)
    .getPublicUrl(path).data.publicUrl;
}

async function uploadImage(file: File, path: string, upsert = false) {
  const storage = createStorageAdminClient();
  const { error } = await storage.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert,
  });
  if (error) return null;
  return storage.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function deleteImage(url: string) {
  const marker = "/storage/v1/object/public/" + BUCKET + "/";
  const path = url.split(marker)[1];
  if (path) {
    const storage = createStorageAdminClient().storage.from(BUCKET);
    await removeStorageObjectOrThrow(path, (paths) => storage.remove(paths));
  }
}

async function buildVariants(
  formData: FormData,
  inputs: VariantInput[],
  productId: number,
  uploads: string[],
): Promise<CatalogVariantDraft[]> {
  const drafts: CatalogVariantDraft[] = [];
  for (let index = 0; index < inputs.length; index += 1) {
    const variant = inputs[index];
    const added: string[] = [];
    const variantFiles = readVariantImageFiles(
      formData,
      index,
      variant.imageCount ?? 0,
    );
    for (const file of variantFiles) {
        const path = randomStoragePath(
          "products/" + productId + "/variants/" + normalizeColor(variant.color),
          file,
        );
        const url = await uploadImage(file, path);
        if (!url) {
          throw new Error(
            "Error uploading image for variant " + variant.color,
          );
        }
        added.push(url);
        uploads.push(url);
    }
    const images = mergeVariantImageUrls(
      variant.id ? (variant.existingImages ?? []) : [],
      added,
      index,
    );
    if (!images.length) {
      throw new Error("Variant " + variant.color + " must include an image");
    }
    drafts.push({
      id: variant.id,
      color: variant.color,
      sizes: variant.sizes,
      images,
    });
  }
  return drafts;
}

const identityStatus = (error: unknown) =>
  error instanceof IdentityError ? identityErrorHttpStatus(error) : null;
const validation = (error: z.ZodError) =>
  NextResponse.json(
    { error: "Invalid product payload", errors: error.flatten().fieldErrors },
    { status: 400 },
  );
const domainError = (error: CatalogSyncError, retryable?: boolean) =>
  NextResponse.json(
    { error: error.message, code: error.code, retryable },
    {
      status:
        error.code === "not_found"
          ? 404
          : error.code === "conflict"
            ? 409
            : 400,
    },
  );

function queued(operationId: string, state: string, message: string) {
  return NextResponse.json(
    {
      success: true,
      accepted: true,
      message,
      operationId,
      syncState: state,
      retryable: true,
    },
    { status: 202 },
  );
}

function pending(result: {
  operationId: string;
  state: string;
  outcome: string;
}) {
  if (result.outcome === "needs_attention") {
    return NextResponse.json(
      {
        success: false,
        error: "Catalog mutation requires attention",
        operationId: result.operationId,
        syncState: result.state,
        retryable: false,
      },
      { status: 409 },
    );
  }
  return queued(
    result.operationId,
    result.state,
    "Catalog mutation is being synchronized",
  );
}

async function postAuthorized(request: NextRequest, principal: UserPrincipal) {
  const manager = createCatalogSyncManager(principal);
  let durable: { operationId: string; state: string } | null = null;
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

    const sync = await manager.processOperation(operation.id);
    durable = { operationId: sync.operationId, state: sync.state };
    if (sync.outcome !== "succeeded") return pending(sync);
    await revalidateProducts(operation.productId);
    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: await manager.findByIdIncludingArchived(operation.productId),
      operationId: operation.id,
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

async function putAuthorized(request: NextRequest, principal: UserPrincipal) {
  const manager = createCatalogSyncManager(principal);
  const uploads: string[] = [];
  let durable: { operationId: string; state: string } | null = null;
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
    await revalidateProducts(id);
    const sync = await manager.processOperation(operation.id);
    durable = { operationId: sync.operationId, state: sync.state };
    if (sync.outcome !== "succeeded") return pending(sync);
    await revalidateProducts(id);
    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: await manager.findByIdIncludingArchived(id),
      operationId: operation.id,
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

async function deleteAuthorized(request: NextRequest, principal: UserPrincipal) {
  let durable: { operationId: string; state: string } | null = null;
  try {
    const id = productIdSchema.parse(request.nextUrl.searchParams.get("id"));
    const manager = createCatalogSyncManager(principal);
    const operation = await manager.enqueueArchive(id);
    durable = { operationId: operation.id, state: operation.state };
    await revalidateProducts(id);
    const sync = await manager.processOperation(operation.id);
    durable = { operationId: sync.operationId, state: sync.state };
    if (sync.outcome !== "succeeded") return pending(sync);
    await revalidateProducts(id);
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      operationId: operation.id,
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
    console.error("Error deleting product", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = createCatalogRouteHandler(
  requireCapabilityFromHeaders,
  identityStatus,
  postAuthorized,
);
export const PUT = createCatalogRouteHandler(
  requireCapabilityFromHeaders,
  identityStatus,
  putAuthorized,
);
export const DELETE = createCatalogRouteHandler(
  requireCapabilityFromHeaders,
  identityStatus,
  deleteAuthorized,
);
