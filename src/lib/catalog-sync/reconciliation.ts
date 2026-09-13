import {
  CatalogSyncError,
  type CatalogSyncStripeResult,
  type CatalogSyncTarget,
} from "./model.ts";

const sameStringSet = (left: readonly string[], right: readonly string[]) => {
  if (new Set(left).size !== left.length || new Set(right).size !== right.length) {
    return false;
  }
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
};

export function validateReconciledStripeResult(
  target: CatalogSyncTarget,
  result: CatalogSyncStripeResult,
): CatalogSyncStripeResult {
  if (target.kind === "preparing") {
    throw new CatalogSyncError(
      "invalid_target",
      "Preparing operations cannot accept Stripe reconciliation",
    );
  }
  if (target.kind === "archive") {
    if (
      result.kind !== "archive" ||
      !sameStringSet(result.archivedPriceIds, target.stripePriceIds)
    ) {
      throw new CatalogSyncError(
        "invalid_target",
        "Reconciled archive Prices do not match the durable target",
      );
    }
    return result;
  }
  const expectedKeys = target.variants.map((variant) => variant.key);
  const actualKeys = result.kind === "upsert" ? Object.keys(result.variants) : [];
  const expectedArchived = target.removedVariants.map(
    (variant) => variant.stripePriceId,
  );
  if (
    result.kind !== "upsert" ||
    !sameStringSet(actualKeys, expectedKeys) ||
    !sameStringSet(result.archivedPriceIds ?? [], expectedArchived) ||
    Object.values(result.variants).some(
      (variant) => !variant.productId || !variant.priceId,
    )
  ) {
    throw new CatalogSyncError(
      "invalid_target",
      "Reconciled upsert result does not match the durable target",
    );
  }
  return result;
}
