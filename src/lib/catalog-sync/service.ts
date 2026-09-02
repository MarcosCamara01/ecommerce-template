import "server-only";

import { randomUUID } from "node:crypto";

import { dataAccess } from "@/lib/data-access";
import { catalogSyncRepository } from "@/lib/data-access/catalog-sync.repository";
import {
  assertSystemPrincipal,
  type SystemPrincipal,
  type UserPrincipal,
} from "@/lib/identity";
import { createStorageAdminClient } from "@/lib/storage/supabase";
import { stripe, Stripe } from "@/lib/stripe";
import { externalErrorFacts } from "@/lib/external/error-facts";
import { createCatalogSyncEngine } from "./engine";
import {
  CatalogSyncError,
  type CatalogSyncState,
} from "./model";
import { applyCatalogSyncToStripe } from "./stripe-operations";
import { isCatalogPreparationComplete } from "./preparation-state";
import { runPreparationCancellation } from "./preparation-cancellation";

const PRODUCT_IMAGES_BUCKET = "product-images";
const PUBLIC_IMAGE_MARKER =
  `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

type CatalogPreparationSweepResult =
  | Awaited<ReturnType<typeof engine.processById>>
  | {
      operationId: string;
      productId: number;
      state: CatalogSyncState;
      outcome: "cancelled" | "needs_attention" | "retry_scheduled";
    };

const engine = createCatalogSyncEngine({
  repository: catalogSyncRepository,
  applyStripe: (operation, heartbeat) => applyCatalogSyncToStripe(stripe, operation, heartbeat),
  classify(error) {
    const facts = externalErrorFacts(error);
    const stripeError = error instanceof Stripe.errors.StripeError;
    const databaseCode = facts.code;
    const retryable = error instanceof CatalogSyncError ? false : stripeError
      ? ["StripeAPIError", "StripeConnectionError", "StripeRateLimitError", "StripeIdempotencyError"].includes(error.type)
      : !(databaseCode && ["23502", "23503", "23505", "23514", "22P02"].includes(databaseCode));
    return {
      retryable,
      code: error instanceof CatalogSyncError ? error.code : stripeError ? error.type : databaseCode ?? "unknown_error",
      detail: facts.detail,
    };
  },
});

export function createCatalogSyncManager(principal: UserPrincipal) {
  const catalog = dataAccess.forCatalogManager(principal).catalog;
  return {
    findByIdIncludingArchived: catalog.findByIdIncludingArchived,
    findArchivedByIdForRestoration: catalog.findArchivedByIdForRestoration,
    prepareCreate: catalogSyncRepository.prepareCreate,
    claimPreparedCreate: catalogSyncRepository.claimPreparedCreate,
    recordPreparedUpload: catalogSyncRepository.recordPreparedUpload,
    releasePreparedCreate: catalogSyncRepository.failPreparedRecovery,
    activatePreparedCreate: catalogSyncRepository.activatePreparedCreate,
    getOperation: catalogSyncRepository.get,
    recordPreparedCleanupFailure:
      catalogSyncRepository.recordPreparedCleanupFailure,
    enqueueUpsert: catalogSyncRepository.enqueueUpsert,
    enqueueArchive: catalogSyncRepository.enqueueArchive,
    processOperation: engine.processById,
    replay: (
      id: string,
      reason: string,
      reconciledStripeResult?: import("./model").CatalogSyncStripeResult,
    ) => catalogSyncRepository.replay(
      id,
      principal.userId,
      reason,
      reconciledStripeResult,
    ),
  };
}

function storagePathFromPublicUrl(url: string) {
  const path = url.split(PUBLIC_IMAGE_MARKER)[1];
  if (!path) {
    throw new CatalogSyncError(
      "invalid_target",
      "Catalog preparation contains an invalid public image URL",
    );
  }
  return decodeURIComponent(path);
}

async function removePreparedImages(imageUrls: string[]) {
  const paths = Array.from(new Set(imageUrls.map(storagePathFromPublicUrl)));
  const bucket = createStorageAdminClient().storage.from(PRODUCT_IMAGES_BUCKET);
  for (let index = 0; index < paths.length; index += 1000) {
    // The 1000-path chunking is the Storage API limit; firing every chunk at
    // once is the failure mode this loop exists to avoid.
    // react-doctor-disable-next-line react-doctor/async-await-in-loop
    const { error } = await bucket.remove(paths.slice(index, index + 1000));
    if (error) throw error;
  }
}

async function recoverStaleCatalogPreparations(limit: number) {
  const results: CatalogPreparationSweepResult[] = [];
  let handled = 0;
  for (let index = 0; index < limit; index += 1) {
    const workerId = randomUUID();
    const operation = await catalogSyncRepository.claimStalePreparation(
      workerId,
    );
    if (!operation) break;
    handled += 1;
    try {
      if (operation.target.kind !== "preparing") {
        throw new CatalogSyncError(
          "invalid_target",
          "Claimed preparation has an invalid target",
        );
      }
      if (
        operation.state !== "cancelling" &&
        isCatalogPreparationComplete(operation.target)
      ) {
        await catalogSyncRepository.activatePreparedCreate(
          operation.id,
          workerId,
        );
        results.push(await engine.processById(operation.id));
        continue;
      }
      const cancelled = await runPreparationCancellation({
        operation,
        beginCancellation: () =>
          catalogSyncRepository.beginCancelPreparedCreate(operation.id, workerId),
        removeImages: removePreparedImages,
        completeCancellation: () =>
          catalogSyncRepository.completeCancelPreparedCreate(
            operation.id,
            workerId,
            "Preparation expired before every planned upload was recorded",
          ),
      });
      if (cancelled) {
        results.push({
          operationId: cancelled.id,
          productId: cancelled.productId,
          state: cancelled.state,
          outcome: cancelled.state === "cancelled"
            ? "cancelled"
            : "retry_scheduled",
        });
      }
    } catch (error) {
      const failed = await catalogSyncRepository.failPreparedRecovery(
        operation.id,
        workerId,
        error,
      );
      if (failed) {
        results.push({
          operationId: failed.id,
          productId: failed.productId,
          state: failed.state,
          outcome: failed.state === "needs_attention"
            ? "needs_attention"
            : "retry_scheduled",
        });
      }
    }
  }
  return { handled, results };
}

export async function runCatalogSyncSweep(
  value: SystemPrincipal,
  options: { limit?: number } = {},
) {
  assertSystemPrincipal(value, "catalog-sync");
  const limit = options.limit ?? 10;
  const boundedLimit = Math.max(1, Math.min(limit, 25));
  const preparationBudget = boundedLimit === 1
    ? 1
    : Math.floor(boundedLimit / 2);
  const recovered = await recoverStaleCatalogPreparations(preparationBudget);
  const remaining = Math.max(0, boundedLimit - recovered.handled);
  const swept = remaining > 0 ? await engine.sweep(remaining) : [];
  return [...recovered.results, ...swept];
}
