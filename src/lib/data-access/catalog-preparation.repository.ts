import "server-only";

import { and, eq, isNull, lte, or } from "drizzle-orm";

import {
  CatalogSyncError,
  type CatalogSyncOperationRecord,
  type CatalogSyncTarget,
} from "@/lib/catalog-sync/model";
import {
  CATALOG_PREPARATION_LEASE_MS,
  CATALOG_PREPARATION_TIMEOUT_MS,
  catalogPreparationCleanupCompletion,
  catalogPreparationFailureTransition,
} from "@/lib/catalog-sync/preparation-state";
import { db } from "@/lib/db/drizzle/connection";
import { catalogSyncOperations, productsItems } from "@/lib/db/drizzle/schema";

function asOperation(
  row: typeof catalogSyncOperations.$inferSelect,
): CatalogSyncOperationRecord {
  return row;
}

async function claimPreparedCreate(
  operationId: string,
  workerId: string,
  now = new Date(),
) {
  return db.transaction(async (tx) => {
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (!operation) {
      throw new CatalogSyncError("not_found", "Catalog operation not found");
    }
    if (operation.target.kind !== "preparing" || operation.state !== "preparing") {
      return asOperation(operation);
    }
    if (
      operation.leaseOwner &&
      operation.leaseOwner !== workerId &&
      operation.leaseExpiresAt &&
      operation.leaseExpiresAt > now
    ) {
      return null;
    }
    const [claimed] = await tx
      .update(catalogSyncOperations)
      .set({
        leaseOwner: workerId,
        leaseExpiresAt: new Date(now.getTime() + CATALOG_PREPARATION_LEASE_MS),
        nextAttemptAt: new Date(now.getTime() + CATALOG_PREPARATION_TIMEOUT_MS),
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    return claimed ? asOperation(claimed) : null;
  });
}

async function recordPreparedUpload(
  operationId: string,
  imageUrl: string,
  workerId: string,
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (!operation) {
      throw new CatalogSyncError("not_found", "Catalog operation not found");
    }
    if (operation.target.kind !== "preparing" || operation.state !== "preparing") {
      throw new CatalogSyncError("conflict", "Catalog preparation is no longer accepting uploads");
    }
    if (
      operation.leaseOwner !== workerId ||
      !operation.leaseExpiresAt ||
      operation.leaseExpiresAt <= now
    ) {
      throw new CatalogSyncError("conflict", "Catalog preparation lease was lost");
    }
    if (!operation.target.uploadedImageUrls.includes(imageUrl)) {
      throw new CatalogSyncError("invalid_target", "Uploaded image is outside the preparation manifest");
    }
    const target: CatalogSyncTarget = {
      ...operation.target,
      completedImageUrls: Array.from(
        new Set([...(operation.target.completedImageUrls ?? []), imageUrl]),
      ),
    };
    const [recorded] = await tx
      .update(catalogSyncOperations)
      .set({
        target,
        leaseExpiresAt: new Date(now.getTime() + CATALOG_PREPARATION_LEASE_MS),
        nextAttemptAt: new Date(now.getTime() + CATALOG_PREPARATION_TIMEOUT_MS),
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    if (!recorded) throw new Error("Catalog upload recording returned no row");
    return asOperation(recorded);
  });
}

async function activatePreparedCreate(operationId: string, workerId: string) {
  return db.transaction(async (tx) => {
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (!operation) {
      throw new CatalogSyncError("not_found", "Catalog operation not found");
    }
    if (operation.target.kind !== "preparing") {
      return asOperation(operation);
    }
    if (operation.state !== "preparing") {
      throw new CatalogSyncError(
        "conflict",
        "Catalog preparation is not in a resumable state",
      );
    }

    const now = new Date();
    if (
      operation.leaseOwner !== workerId ||
      !operation.leaseExpiresAt ||
      operation.leaseExpiresAt <= now
    ) {
      throw new CatalogSyncError("conflict", "Catalog preparation lease was lost");
    }
    const completedImages = new Set(
      operation.target.completedImageUrls ?? [],
    );
    if (
      operation.target.uploadedImageUrls.some(
        (imageUrl) => !completedImages.has(imageUrl),
      )
    ) {
      throw new CatalogSyncError(
        "invalid_target",
        "Catalog preparation cannot activate before every upload is recorded",
      );
    }

    const [product] = await tx
      .select()
      .from(productsItems)
      .where(eq(productsItems.id, operation.productId))
      .for("update");
    if (!product || product.img !== "" || !product.archivedAt) {
      throw new CatalogSyncError(
        "invalid_target",
        "Catalog preparation no longer owns an incomplete product shell",
      );
    }

    const prepared = operation.target;
    const target: CatalogSyncTarget = {
      kind: "upsert",
      expectedProductUpdatedAt: now.toISOString(),
      createdShell: true,
      product: prepared.product,
      variants: prepared.variants,
      removedVariants: [],
      uploadedImageUrls: prepared.uploadedImageUrls,
      priorSnapshot: prepared.priorSnapshot,
    };
    await tx
      .update(productsItems)
      .set({ archivedAt: now, updatedAt: now })
      .where(eq(productsItems.id, operation.productId));
    const [activated] = await tx
      .update(catalogSyncOperations)
      .set({
        state: "pending",
        target,
        nextAttemptAt: now,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    if (!activated) {
      throw new Error("Catalog preparation activation returned no row");
    }
    return asOperation(activated);
  });
}

async function claimStalePreparation(workerId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(
        and(
          or(
            eq(catalogSyncOperations.state, "preparing"),
            eq(catalogSyncOperations.state, "cancelling"),
          ),
          lte(catalogSyncOperations.nextAttemptAt, now),
          or(
            isNull(catalogSyncOperations.leaseExpiresAt),
            lte(catalogSyncOperations.leaseExpiresAt, now),
          ),
        ),
      )
      .orderBy(catalogSyncOperations.nextAttemptAt, catalogSyncOperations.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!operation) return null;
    const [claimed] = await tx
      .update(catalogSyncOperations)
      .set({
        leaseOwner: workerId,
        leaseExpiresAt: new Date(now.getTime() + CATALOG_PREPARATION_LEASE_MS),
        attemptCount: operation.attemptCount + 1,
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operation.id))
      .returning();
    return claimed ? asOperation(claimed) : null;
  });
}

async function beginCancelPreparedCreate(
  operationId: string,
  workerId: string,
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (
      !operation ||
      operation.state !== "preparing" ||
      operation.target.kind !== "preparing" ||
      operation.leaseOwner !== workerId ||
      !operation.leaseExpiresAt ||
      operation.leaseExpiresAt <= now
    ) return null;
    const [cancelling] = await tx
      .update(catalogSyncOperations)
      .set({
        state: "cancelling",
        nextAttemptAt: now,
        lastErrorCode: "preparation_cleanup_pending",
        lastErrorDetail: "Preparation cleanup is in progress",
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    return cancelling ? asOperation(cancelling) : null;
  });
}

async function completeCancelPreparedCreate(
  operationId: string,
  workerId: string,
  detail: string,
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (
      !operation ||
      operation.state !== "cancelling" ||
      operation.target.kind !== "preparing" ||
      operation.leaseOwner !== workerId ||
      !operation.leaseExpiresAt ||
      operation.leaseExpiresAt <= now
    ) {
      return null;
    }
    const transition = catalogPreparationCleanupCompletion(
      operation.lastErrorCode,
      now,
    );
    const [cancelled] = await tx
      .update(catalogSyncOperations)
      .set({
        state: transition.state,
        activeProductId:
          transition.state === "cancelled" ? null : operation.productId,
        nextAttemptAt: transition.nextAttemptAt,
        leaseOwner: null,
        leaseExpiresAt: null,
        lastErrorCode: transition.errorCode,
        lastErrorDetail: detail.slice(0, 2000),
        completedAt: transition.completedAt,
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    return cancelled ? asOperation(cancelled) : null;
  });
}

async function recordPreparedCleanupFailure(
  operationId: string,
  error: unknown,
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (
      !operation ||
      operation.target.kind !== "preparing" ||
      !["cancelling", "cancelled"].includes(operation.state)
    ) return null;
    const reopening = operation.state === "cancelled";
    const [recorded] = await tx
      .update(catalogSyncOperations)
      .set({
        state: "cancelling",
        activeProductId: operation.productId,
        nextAttemptAt: now,
        leaseOwner: reopening ? null : operation.leaseOwner,
        leaseExpiresAt: reopening ? null : operation.leaseExpiresAt,
        lastErrorCode: "late_upload_cleanup_failed",
        lastErrorDetail: (error instanceof Error ? error.message : String(error))
          .slice(0, 2000),
        completedAt: null,
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    return recorded ? asOperation(recorded) : null;
  });
}

async function failPreparedRecovery(
  operationId: string,
  workerId: string,
  error: unknown,
) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [operation] = await tx
      .select()
      .from(catalogSyncOperations)
      .where(eq(catalogSyncOperations.id, operationId))
      .for("update");
    if (
      !operation ||
      !["preparing", "cancelling"].includes(operation.state) ||
      operation.leaseOwner !== workerId
    ) {
      return null;
    }
    const transition = catalogPreparationFailureTransition(
      operation.attemptCount,
      now,
      operation.state === "cancelling" ? "cancelling" : "preparing",
    );
    const [failed] = await tx
      .update(catalogSyncOperations)
      .set({
        state: transition.state,
        nextAttemptAt: transition.nextAttemptAt,
        leaseOwner: null,
        leaseExpiresAt: null,
        lastErrorCode: transition.errorCode,
        lastErrorDetail: (error instanceof Error ? error.message : String(error)).slice(0, 2000),
        updatedAt: now,
      })
      .where(eq(catalogSyncOperations.id, operationId))
      .returning();
    return failed ? asOperation(failed) : null;
  });
}

export const catalogPreparationRepository = {
  claimPreparedCreate,
  recordPreparedUpload,
  activatePreparedCreate,
  claimStalePreparation,
  beginCancelPreparedCreate,
  completeCancelPreparedCreate,
  recordPreparedCleanupFailure,
  failPreparedRecovery,
};
