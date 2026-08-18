import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";

import {
  CatalogSyncError,
  type CatalogProductDraft,
  type CatalogSnapshot,
  type CatalogSyncOperationRecord,
  type CatalogSyncStripeResult,
  type CatalogSyncTarget,
  type CatalogVariantDraft,
} from "@/lib/catalog-sync/model";
import {
  CATALOG_SYNC_LEASE_MS,
  catalogSyncReplaySafety,
  catalogSyncFailureState,
  isCatalogSyncClaimEligible,
  nextCatalogSyncAttemptAt,
} from "@/lib/catalog-sync/state-machine";
import { CATALOG_PREPARATION_TIMEOUT_MS } from "@/lib/catalog-sync/preparation-state";
import { validateReconciledStripeResult } from "@/lib/catalog-sync/reconciliation";
import { catalogPreparationRepository } from "./catalog-preparation.repository";
import {
  catalogPriceCentsFromStoredDecimal,
  catalogPriceDecimalFromCents,
} from "@/lib/catalog-sync/money";
import { db, type DatabaseTransaction } from "@/lib/db/drizzle/connection";
import {
  CatalogVariantColorHandoffConflictError,
  CatalogVariantIdentityConflictError,
  planCatalogVariantMutation,
  restorableVariantIdsFromArchiveTarget,
} from "@/lib/db/drizzle/repositories/catalog-archive";
import {
  catalogSyncOperations,
  catalogSyncReplayAudit,
  productsItems,
  productsVariants,
} from "@/lib/db/drizzle/schema";

function asOperation(row: typeof catalogSyncOperations.$inferSelect): CatalogSyncOperationRecord {
  return row;
}

function snapshot(
  product: typeof productsItems.$inferSelect,
  variants: Array<typeof productsVariants.$inferSelect>,
): CatalogSnapshot {
  return {
    product: {
      name: product.name,
      description: product.description,
      priceCents: catalogPriceCentsFromStoredDecimal(product.price),
      category: product.category,
      img: product.img,
      archivedAt: product.archivedAt?.toISOString() ?? null,
    },
    variants: variants.map((variant) => ({
      id: variant.id,
      stripePriceId: variant.stripeId,
      color: variant.color,
      sizes: variant.sizes,
      images: variant.images,
      archivedAt: variant.archivedAt?.toISOString() ?? null,
    })),
  };
}

type PrepareCatalogCreateInput = {
  operationId: string;
  requestHash: string;
  product: CatalogProductDraft;
  variants: CatalogVariantDraft[];
  uploadedImageUrls: string[];
};

function assertMatchingCreateCommand(
  operation: typeof catalogSyncOperations.$inferSelect,
  input: PrepareCatalogCreateInput,
) {
  if (
    operation.action !== "upsert" ||
    operation.requestHash !== input.requestHash
  ) {
    throw new CatalogSyncError(
      "conflict",
      "This catalog creation command was already used with different input",
    );
  }
  return asOperation(operation);
}

function createPreparationTarget(
  input: PrepareCatalogCreateInput,
  shell: typeof productsItems.$inferSelect,
): CatalogSyncTarget {
  if (!input.requestHash) {
    throw new CatalogSyncError(
      "invalid_target",
      "Catalog creation request hash is required",
    );
  }
  if (
    input.variants.some((variant) => variant.id !== undefined) ||
    new Set(input.variants.map((variant) => variant.color)).size !==
      input.variants.length
  ) {
    throw new CatalogSyncError(
      "invalid_target",
      "New catalog variants must have unique colors and no existing identity",
    );
  }

  const uploads = new Set(input.uploadedImageUrls);
  const referenced = new Set([
    input.product.img,
    ...input.variants.flatMap((variant) => variant.images),
  ]);
  if (
    uploads.size !== input.uploadedImageUrls.length ||
    !uploads.has(input.product.img) ||
    Array.from(referenced).some((url) => !uploads.has(url)) ||
    input.uploadedImageUrls.some((url) => !referenced.has(url)) ||
    input.variants.some((variant) => variant.images.length === 0)
  ) {
    throw new CatalogSyncError(
      "invalid_target",
      "Catalog creation uploads must exactly match the requested images",
    );
  }

  return {
    kind: "preparing",
    expectedProductUpdatedAt:
      shell.updatedAt?.toISOString() ?? new Date().toISOString(),
    createdShell: true,
    product: input.product,
    variants: input.variants.map((variant, index) => ({
      key: "variant-" + index,
      variantId: null,
      stripePriceId: null,
      color: variant.color,
      sizes: variant.sizes,
      images: variant.images,
    })),
    uploadedImageUrls: input.uploadedImageUrls,
    completedImageUrls: [],
    priorSnapshot: snapshot(shell, []),
  };
}

async function prepareCreate(input: PrepareCatalogCreateInput) {
  const existing = await get(input.operationId);
  if (existing) return assertMatchingCreateCommand(existing, input);

  try {
    return await db.transaction(async (tx) => {
      const [alreadyCreated] = await tx
        .select()
        .from(catalogSyncOperations)
        .where(eq(catalogSyncOperations.id, input.operationId))
        .for("update");
      if (alreadyCreated) {
        return assertMatchingCreateCommand(alreadyCreated, input);
      }

      const now = new Date();
      const [shell] = await tx
        .insert(productsItems)
        .values({
          ...input.product,
          price: catalogPriceDecimalFromCents(input.product.priceCents),
          img: "",
          archivedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!shell) throw new Error("Catalog shell insert returned no row");

      const target = createPreparationTarget(input, shell);
      const [operation] = await tx
        .insert(catalogSyncOperations)
        .values({
          id: input.operationId,
          productId: shell.id,
          activeProductId: shell.id,
          action: "upsert",
          requestHash: input.requestHash,
          state: "preparing",
          target,
          nextAttemptAt: new Date(now.getTime() + CATALOG_PREPARATION_TIMEOUT_MS),
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!operation) {
        throw new Error("Catalog preparation insert returned no row");
      }
      return asOperation(operation);
    });
  } catch (error) {
    const concurrentOperation = await get(input.operationId);
    if (concurrentOperation) {
      return assertMatchingCreateCommand(concurrentOperation, input);
    }
    throw error;
  }
}

async function lockProduct(tx: DatabaseTransaction, productId: number) {
  const [product] = await tx.select().from(productsItems).where(eq(productsItems.id, productId)).for("update");
  if (!product) throw new CatalogSyncError("not_found", "Product not found");
  const [active] = await tx.select({ id: catalogSyncOperations.id }).from(catalogSyncOperations)
    .where(eq(catalogSyncOperations.activeProductId, productId)).limit(1);
  if (active) throw new CatalogSyncError("conflict", "A catalog mutation is already active");
  return product;
}

async function moveUnsafeClaimToNeedsAttention(
  tx: DatabaseTransaction,
  operation: typeof catalogSyncOperations.$inferSelect,
  now: Date,
) {
  const safety = catalogSyncReplaySafety(asOperation(operation), now);
  if (safety.allowed) return false;
  await tx.update(catalogSyncOperations).set({
    state: "needs_attention",
    nextAttemptAt: now,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastErrorCode: "reconciliation_required",
    lastErrorDetail: "Stripe reconciliation is required before resuming this expired catalog operation",
    updatedAt: now,
  }).where(eq(catalogSyncOperations.id, operation.id));
  return true;
}

async function enqueueUpsert(input: {
  productId: number;
  product: CatalogProductDraft;
  variants: CatalogVariantDraft[];
  uploadedImageUrls: string[];
  createdShell: boolean;
  restoreArchived: boolean;
}) {
  return db.transaction(async (tx) => {
    const product = await lockProduct(tx, input.productId);
    if (input.createdShell && product.img !== "") {
      throw new CatalogSyncError("invalid_target", "Product is not an incomplete shell");
    }
    if (!input.createdShell && product.archivedAt && !input.restoreArchived) {
      throw new CatalogSyncError(
        "conflict",
        "Product was archived before this update acquired its lock",
      );
    }
    const variants = await tx.select().from(productsVariants).where(eq(productsVariants.productId, input.productId));
    const existingById = new Map(variants.map((variant) => [variant.id, variant]));
    const existingByColor = new Map(
      variants.map((variant) => [variant.color, variant]),
    );
    if (product.archivedAt && input.restoreArchived) {
      const [archiveOperation] = await tx
        .select({ target: catalogSyncOperations.target })
        .from(catalogSyncOperations)
        .where(
          and(
            eq(catalogSyncOperations.productId, input.productId),
            eq(catalogSyncOperations.action, "archive"),
            eq(catalogSyncOperations.state, "succeeded"),
          ),
        )
        .orderBy(
          desc(catalogSyncOperations.completedAt),
          desc(catalogSyncOperations.createdAt),
        )
        .limit(1);
      const restorableIds = archiveOperation
        ? restorableVariantIdsFromArchiveTarget(archiveOperation.target)
        : null;
      if (!restorableIds) {
        throw new CatalogSyncError(
          "conflict",
          "Product restoration lacks durable archive evidence",
        );
      }
      const allowed = new Set(restorableIds);
      for (const variant of input.variants) {
        const durableVariant = variant.id
          ? existingById.get(variant.id)
          : existingByColor.get(variant.color);
        if (durableVariant && !allowed.has(durableVariant.id)) {
          throw new CatalogSyncError(
            "conflict",
            "Variant was archived before the product and requires a separate decision",
          );
        }
      }
    }
    const ids = input.variants.flatMap((variant) => variant.id ? [variant.id] : []);
    if (new Set(ids).size !== ids.length || new Set(input.variants.map((variant) => variant.color)).size !== input.variants.length) {
      throw new CatalogSyncError("invalid_target", "Variant ids and colors must be unique");
    }
    for (const variant of input.variants) {
      if (variant.id && !existingById.has(variant.id)) {
        throw new CatalogSyncError("invalid_target", "Variant does not belong to product");
      }
    }
    const mutationPlan = (() => {
      try {
        return planCatalogVariantMutation(variants, input.variants);
      } catch (error) {
        if (
          error instanceof CatalogVariantIdentityConflictError ||
          error instanceof CatalogVariantColorHandoffConflictError
        ) {
          throw new CatalogSyncError("invalid_target", error.message);
        }
        throw error;
      }
    })();
    const plannedVariants = mutationPlan.mutations.map((mutation) => {
      const variant = input.variants[mutation.incomingIndex];
      if (!variant) {
        throw new CatalogSyncError("invalid_target", "Variant plan is inconsistent");
      }
      return {
        variant,
        existing: mutation.existingId === null
          ? null
          : existingById.get(mutation.existingId) ?? null,
      };
    });
    const uploads = new Set(input.uploadedImageUrls);
    if (input.product.img !== product.img && !uploads.has(input.product.img)) {
      throw new CatalogSyncError("invalid_target", "Main image is not owned by this mutation");
    }
    for (const { variant, existing } of plannedVariants) {
      const oldImages = new Set(existing?.images ?? []);
      if (variant.images.some((image) => !oldImages.has(image) && !uploads.has(image))) {
        throw new CatalogSyncError("invalid_target", "Variant image is not owned by this mutation");
      }
    }
    const referenced = new Set([input.product.img, ...input.variants.flatMap((variant) => variant.images)]);
    if (input.uploadedImageUrls.some((url) => !referenced.has(url))) {
      throw new CatalogSyncError("invalid_target", "Mutation contains an unused upload");
    }
    const now = new Date();
    const archiveIds = new Set(mutationPlan.archiveIds);
    const target: CatalogSyncTarget = {
      kind: "upsert",
      expectedProductUpdatedAt: now.toISOString(),
      createdShell: input.createdShell,
      product: input.product,
      variants: plannedVariants.map(({ variant, existing }) => {
        return {
          key: existing ? `variant-${existing.id}` : `variant-${randomUUID()}`,
          variantId: existing?.id ?? null,
          stripePriceId: existing?.stripeId ?? null,
          color: variant.color,
          sizes: variant.sizes,
          images: variant.images,
        };
      }),
      removedVariants: variants
        .filter((variant) => archiveIds.has(variant.id))
        .map((variant) => ({ variantId: variant.id, stripePriceId: variant.stripeId })),
      uploadedImageUrls: Array.from(uploads),
      priorSnapshot: snapshot(product, variants),
    };
    const [operation] = await tx.insert(catalogSyncOperations).values({
      id: randomUUID(), productId: input.productId, activeProductId: input.productId,
      action: "upsert", state: "pending", target, nextAttemptAt: now,
      createdAt: now, updatedAt: now,
    }).returning();
    await tx.update(productsItems).set({ archivedAt: now, updatedAt: now }).where(eq(productsItems.id, input.productId));
    if (!operation) throw new Error("Catalog sync insert returned no row");
    return asOperation(operation);
  });
}

async function enqueueArchive(productId: number) {
  return db.transaction(async (tx) => {
    const product = await lockProduct(tx, productId);
    if (product.archivedAt) throw new CatalogSyncError("not_found", "Product not found");
    const variants = await tx.select().from(productsVariants).where(eq(productsVariants.productId, productId));
    const now = new Date();
    const target: CatalogSyncTarget = {
      kind: "archive",
      expectedProductUpdatedAt: now.toISOString(),
      stripePriceIds: Array.from(
        new Set(variants.map((variant) => variant.stripeId)),
      ),
      priorSnapshot: snapshot(product, variants),
    };
    const [operation] = await tx.insert(catalogSyncOperations).values({
      id: randomUUID(), productId, activeProductId: productId, action: "archive",
      state: "pending", target, nextAttemptAt: now, createdAt: now, updatedAt: now,
    }).returning();
    await tx.update(productsItems).set({ archivedAt: now, updatedAt: now }).where(eq(productsItems.id, productId));
    if (!operation) throw new Error("Catalog sync insert returned no row");
    return asOperation(operation);
  });
}

async function claimById(operationId: string, workerId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [operation] = await tx.select().from(catalogSyncOperations).where(eq(catalogSyncOperations.id, operationId)).for("update");
    if (!operation || !isCatalogSyncClaimEligible(asOperation(operation), now)) return null;
    if (await moveUnsafeClaimToNeedsAttention(tx, operation, now)) return null;
    const [claimed] = await tx.update(catalogSyncOperations).set({
      state: "processing", attemptCount: operation.attemptCount + 1, leaseOwner: workerId,
      leaseExpiresAt: new Date(now.getTime() + CATALOG_SYNC_LEASE_MS), updatedAt: now,
    }).where(eq(catalogSyncOperations.id, operationId)).returning();
    return claimed ? asOperation(claimed) : null;
  });
}

async function claimNext(workerId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    while (true) {
      const [operation] = await tx.select().from(catalogSyncOperations).where(or(
        and(inArray(catalogSyncOperations.state, ["pending", "retry_wait"]), lte(catalogSyncOperations.nextAttemptAt, now)),
        and(eq(catalogSyncOperations.state, "processing"), or(isNull(catalogSyncOperations.leaseExpiresAt), lte(catalogSyncOperations.leaseExpiresAt, now))),
      )).orderBy(catalogSyncOperations.nextAttemptAt, catalogSyncOperations.createdAt).limit(1).for("update", { skipLocked: true });
      if (!operation) return null;
      if (await moveUnsafeClaimToNeedsAttention(tx, operation, now)) continue;
      const [claimed] = await tx.update(catalogSyncOperations).set({
        state: "processing", attemptCount: operation.attemptCount + 1, leaseOwner: workerId,
        leaseExpiresAt: new Date(now.getTime() + CATALOG_SYNC_LEASE_MS), updatedAt: now,
      }).where(eq(catalogSyncOperations.id, operation.id)).returning();
      return claimed ? asOperation(claimed) : null;
    }
  });
}

async function renewLease(operationId: string, workerId: string, now = new Date()) {
  const [row] = await db.update(catalogSyncOperations).set({ leaseExpiresAt: new Date(now.getTime() + CATALOG_SYNC_LEASE_MS), updatedAt: now })
    .where(and(eq(catalogSyncOperations.id, operationId), eq(catalogSyncOperations.state, "processing"), eq(catalogSyncOperations.leaseOwner, workerId), gt(catalogSyncOperations.leaseExpiresAt, now)))
    .returning({ id: catalogSyncOperations.id });
  return Boolean(row);
}

async function recordStripeResult(operationId: string, workerId: string, result: CatalogSyncStripeResult, now = new Date()) {
  const [row] = await db.update(catalogSyncOperations).set({ stripeResult: result, updatedAt: now })
    .where(and(eq(catalogSyncOperations.id, operationId), eq(catalogSyncOperations.state, "processing"), eq(catalogSyncOperations.leaseOwner, workerId), gt(catalogSyncOperations.leaseExpiresAt, now)))
    .returning({ id: catalogSyncOperations.id });
  return Boolean(row);
}

async function finalize(operationId: string, workerId: string, now = new Date()) {
  return db.transaction(async (tx): Promise<"succeeded" | "lease_lost" | "stale_catalog" | "invalid_result"> => {
    const [operation] = await tx.select().from(catalogSyncOperations).where(eq(catalogSyncOperations.id, operationId)).for("update");
    if (!operation || operation.state !== "processing" || operation.leaseOwner !== workerId || !operation.leaseExpiresAt || operation.leaseExpiresAt <= now) return "lease_lost";
    const [product] = await tx.select().from(productsItems).where(eq(productsItems.id, operation.productId)).for("update");
    if (!product || !product.updatedAt || product.updatedAt.toISOString() !== operation.target.expectedProductUpdatedAt) return "stale_catalog";
    if (operation.target.kind === "upsert") {
      const stripeResult = operation.stripeResult;
      if (!stripeResult || stripeResult.kind !== "upsert" || operation.target.variants.some((variant) => !stripeResult.variants[variant.key])) return "invalid_result";
      await tx.update(productsItems).set({
        name: operation.target.product.name, description: operation.target.product.description,
        price: catalogPriceDecimalFromCents(operation.target.product.priceCents), category: operation.target.product.category,
        img: operation.target.product.img, archivedAt: null, updatedAt: now,
      }).where(eq(productsItems.id, operation.productId));
      const removedIds = operation.target.removedVariants.map((variant) => variant.variantId);
      if (removedIds.length) await tx.update(productsVariants).set({ archivedAt: now, updatedAt: now }).where(and(eq(productsVariants.productId, operation.productId), inArray(productsVariants.id, removedIds)));
      for (const variant of operation.target.variants) {
        const stripeVariant = stripeResult.variants[variant.key];
        if (variant.variantId) {
          await tx.update(productsVariants).set({ stripeId: stripeVariant.priceId, color: variant.color, sizes: variant.sizes, images: variant.images, archivedAt: null, updatedAt: now })
            .where(and(eq(productsVariants.id, variant.variantId), eq(productsVariants.productId, operation.productId)));
        } else {
          await tx.insert(productsVariants).values({ productId: operation.productId, stripeId: stripeVariant.priceId, color: variant.color, sizes: variant.sizes, images: variant.images, archivedAt: null, createdAt: now, updatedAt: now });
        }
      }
    } else if (operation.target.kind === "archive") {
      if (!operation.stripeResult || operation.stripeResult.kind !== "archive") return "invalid_result";
      await tx.update(productsItems).set({ archivedAt: now, updatedAt: now }).where(eq(productsItems.id, operation.productId));
      await tx.update(productsVariants).set({ archivedAt: now, updatedAt: now }).where(eq(productsVariants.productId, operation.productId));
    } else {
      return "invalid_result";
    }
    await tx.update(catalogSyncOperations).set({ state: "succeeded", activeProductId: null, leaseOwner: null, leaseExpiresAt: null, lastErrorCode: null, lastErrorDetail: null, completedAt: now, updatedAt: now }).where(eq(catalogSyncOperations.id, operationId));
    return "succeeded";
  });
}

async function fail(input: { operationId: string; workerId: string; retryable: boolean; errorCode: string; errorDetail: string }) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx.select().from(catalogSyncOperations).where(eq(catalogSyncOperations.id, input.operationId)).for("update");
    if (!operation || operation.state !== "processing" || operation.leaseOwner !== input.workerId || !operation.leaseExpiresAt || operation.leaseExpiresAt <= now) return null;
    const state = catalogSyncFailureState(operation.attemptCount, input.retryable);
    const [failed] = await tx.update(catalogSyncOperations).set({
      state, nextAttemptAt: state === "retry_wait" ? nextCatalogSyncAttemptAt(operation.attemptCount, now) : now,
      leaseOwner: null, leaseExpiresAt: null, lastErrorCode: input.errorCode.slice(0, 200),
      lastErrorDetail: input.errorDetail.slice(0, 2000), updatedAt: now,
    }).where(eq(catalogSyncOperations.id, input.operationId)).returning();
    return failed ? asOperation(failed) : null;
  });
}

async function replay(
  operationId: string,
  operatorUserId: string,
  reason: string,
  reconciledStripeResult?: CatalogSyncStripeResult,
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx.select().from(catalogSyncOperations).where(eq(catalogSyncOperations.id, operationId)).for("update");
    if (!operation) throw new CatalogSyncError("not_found", "Operation not found");
    if (operation.state !== "needs_attention") throw new CatalogSyncError("conflict", "Only needs_attention operations can be replayed");
    let stripeResult = operation.stripeResult;
    if (operation.target.kind === "preparing" && reconciledStripeResult) {
      throw new CatalogSyncError(
        "conflict",
        "Preparation recovery does not accept Stripe reconciliation",
      );
    }
    if (operation.target.kind !== "preparing") {
      const replaySafety = catalogSyncReplaySafety(asOperation(operation), now);
      if (!replaySafety.allowed) {
        if (!reconciledStripeResult) {
          throw new CatalogSyncError(
            "reconciliation_required",
            "Stripe reconciliation is required before replaying this expired catalog operation",
          );
        }
        stripeResult = validateReconciledStripeResult(
          operation.target,
          reconciledStripeResult,
        );
      } else if (reconciledStripeResult) {
        throw new CatalogSyncError(
          "conflict",
          "Stripe reconciliation is accepted only when replay requires it",
        );
      }
    }
    await tx.insert(catalogSyncReplayAudit).values({
      operationId,
      priorState: operation.state,
      priorErrorCode: operation.lastErrorCode,
      priorErrorDetail: operation.lastErrorDetail,
      operatorUserId,
      reason,
      createdAt: now,
    });
    const replayState = operation.target.kind === "preparing"
      ? operation.lastErrorCode?.startsWith("preparation_cleanup_")
        ? "cancelling"
        : "preparing"
      : "pending";
    const [replayed] = await tx.update(catalogSyncOperations).set({ state: replayState, stripeResult, nextAttemptAt: now, leaseOwner: null, leaseExpiresAt: null, lastErrorCode: null, lastErrorDetail: null, lastOperatorUserId: operatorUserId, lastOperatorReason: reason, updatedAt: now }).where(eq(catalogSyncOperations.id, operationId)).returning();
    if (!replayed) throw new Error("Catalog sync replay returned no row");
    return asOperation(replayed);
  });
}

async function get(operationId: string) {
  const [operation] = await db.select().from(catalogSyncOperations).where(eq(catalogSyncOperations.id, operationId)).limit(1);
  return operation ? asOperation(operation) : null;
}

export const catalogSyncRepository = {
  prepareCreate,
  ...catalogPreparationRepository,
  enqueueUpsert,
  enqueueArchive,
  claimById,
  claimNext,
  renewLease,
  recordStripeResult,
  finalize,
  fail,
  replay,
  get,
};
