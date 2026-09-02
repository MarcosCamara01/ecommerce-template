import type { CatalogSyncOperationRecord } from "./model";

export const CATALOG_SYNC_MAX_ATTEMPTS = 8;
export const CATALOG_SYNC_LEASE_MS = 5 * 60 * 1000;
export const CATALOG_SYNC_IDEMPOTENCY_REPLAY_WINDOW_MS = 24 * 60 * 60_000;

export type CatalogSyncReplaySafety =
  | Readonly<{ allowed: true }>
  | Readonly<{
      allowed: false;
      reason: "stripe_reconciliation_required";
    }>;

/**
 * Stripe may prune an idempotency key once it is 24 hours old. A persisted
 * result is safe to finalize without another Stripe mutation; otherwise an
 * older operation needs verified reconciliation instead of a blind replay.
 */
export function catalogSyncReplaySafety(
  operation: Pick<
    CatalogSyncOperationRecord,
    "attemptCount" | "createdAt" | "state" | "stripeResult"
  >,
  now: Date,
): CatalogSyncReplaySafety {
  if (operation.stripeResult) return { allowed: true };
  if (operation.state === "pending" && operation.attemptCount === 0) {
    return { allowed: true };
  }
  if (
    now.getTime() - operation.createdAt.getTime() <
      CATALOG_SYNC_IDEMPOTENCY_REPLAY_WINDOW_MS
  ) {
    return { allowed: true };
  }
  return { allowed: false, reason: "stripe_reconciliation_required" };
}

export function isCatalogSyncClaimEligible(
  operation: Pick<CatalogSyncOperationRecord, "state" | "nextAttemptAt" | "leaseExpiresAt">,
  now: Date,
) {
  if (operation.state === "processing") {
    return !operation.leaseExpiresAt || operation.leaseExpiresAt <= now;
  }
  return (
    (operation.state === "pending" || operation.state === "retry_wait") &&
    operation.nextAttemptAt <= now
  );
}

export function catalogSyncFailureState(attemptCount: number, retryable: boolean) {
  return retryable && attemptCount < CATALOG_SYNC_MAX_ATTEMPTS
    ? ("retry_wait" as const)
    : ("needs_attention" as const);
}

export function nextCatalogSyncAttemptAt(attemptCount: number, now: Date) {
  return new Date(
    now.getTime() + Math.min(15 * 60_000, 2 ** Math.max(0, attemptCount - 1) * 1000),
  );
}
