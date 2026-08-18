import type { CatalogSyncTarget } from "./model";
import { CATALOG_SYNC_MAX_ATTEMPTS } from "./state-machine.ts";

export const CATALOG_PREPARATION_LEASE_MS = 15 * 60 * 1000;
export const CATALOG_PREPARATION_TIMEOUT_MS = 15 * 60 * 1000;
export const CATALOG_PREPARATION_RETRY_MS = 5 * 60 * 1000;
export const CATALOG_PREPARATION_SETTLE_MS = 15 * 60 * 1000;

type CatalogPreparationTarget = Extract<CatalogSyncTarget, { kind: "preparing" }>;

export function isCatalogPreparationComplete(target: CatalogPreparationTarget) {
  const completed = new Set(target.completedImageUrls ?? []);
  return target.uploadedImageUrls.every((imageUrl) => completed.has(imageUrl));
}

export function catalogPreparationFailureTransition(
  attemptCount: number,
  now = new Date(),
  phase: "preparing" | "cancelling" = "preparing",
) {
  const exhausted = attemptCount >= CATALOG_SYNC_MAX_ATTEMPTS;
  return {
    state: exhausted ? "needs_attention" as const : phase,
    nextAttemptAt: exhausted
      ? now
      : new Date(now.getTime() + CATALOG_PREPARATION_RETRY_MS),
    errorCode: phase === "cancelling"
      ? exhausted
        ? "preparation_cleanup_exhausted"
        : "preparation_cleanup_failed"
      : exhausted
        ? "preparation_recovery_exhausted"
        : "preparation_recovery_failed",
  };
}

export function shouldCompensateRejectedPreparedUpload(
  state: string | null | undefined,
): boolean {
  return state === "cancelling" || state === "cancelled";
}

export function catalogPreparationCleanupCompletion(
  priorErrorCode: string | null,
  now = new Date(),
) {
  const settled = priorErrorCode === "preparation_cleanup_settling";
  return settled
    ? {
        state: "cancelled" as const,
        nextAttemptAt: now,
        errorCode: "preparation_cancelled",
        completedAt: now,
      }
    : {
        state: "cancelling" as const,
        nextAttemptAt: new Date(now.getTime() + CATALOG_PREPARATION_SETTLE_MS),
        errorCode: "preparation_cleanup_settling",
        completedAt: null,
      };
}
