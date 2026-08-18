export type CheckoutSnapshotItem = {
  cartItemId: number;
  variantId: number;
  size: string;
  quantity: number;
  priceId: string;
  unitAmount: number;
  currency: string;
};

export type ChargedLineItem = {
  priceId: string;
  quantity: number;
  unitAmount: number;
  currency: string;
};

type ReferencedVariant = Readonly<{ id: number }>;

export function createCheckoutMetadata(
  checkoutIntentId: string,
): Record<string, string> {
  if (!checkoutIntentId) {
    throw new Error("Checkout intent id is required");
  }
  return { checkoutIntentId };
}

export function parseStripeChargedLineItem(lineItem: {
  price?: {
    id?: string | null;
    unit_amount?: number | null;
    currency?: string | null;
  } | null;
  currency?: string | null;
  quantity?: number | null;
}): ChargedLineItem {
  const priceId = lineItem.price?.id;
  const unitAmount = lineItem.price?.unit_amount;
  const currency = lineItem.currency ?? lineItem.price?.currency;
  const quantity = lineItem.quantity;
  if (
    !priceId ||
    !Number.isSafeInteger(unitAmount) ||
    Number(unitAmount) < 0 ||
    !currency ||
    !Number.isSafeInteger(quantity) ||
    Number(quantity) <= 0
  ) {
    throw permanentReconciliationFailure(
      "stripe_evidence_incomplete",
      "incomplete_line_item: Stripe line item lacks valid price facts",
    );
  }
  return {
    priceId,
    quantity: Number(quantity),
    unitAmount: Number(unitAmount),
    currency,
  };
}

export function reconcileChargedItems(
  snapshot: readonly CheckoutSnapshotItem[],
  charged: readonly ChargedLineItem[],
): CheckoutSnapshotItem[] {
  assertValidSnapshot(snapshot);
  const snapshotQuantity = aggregateQuantity(snapshot);
  const chargedQuantity = aggregateQuantity(charged);
  if (
    snapshotQuantity.size !== chargedQuantity.size ||
    Array.from(snapshotQuantity.entries()).some(
      ([priceId, quantity]) => chargedQuantity.get(priceId) !== quantity,
    )
  ) {
    throw permanentReconciliationFailure(
      "stripe_evidence_mismatch",
      "Stripe line items do not match the checkout snapshot",
    );
  }
  const priceFacts = collectConsistentPriceFacts(charged);
  return snapshot.map((item) => {
    const facts = priceFacts.get(item.priceId);
    if (!facts) {
      throw permanentReconciliationFailure(
        "stripe_evidence_mismatch",
        `Missing charged price ${item.priceId}`,
      );
    }
    if (
      item.unitAmount !== facts.unitAmount ||
      item.currency.toLowerCase() !== facts.currency.toLowerCase()
    ) {
      throw permanentReconciliationFailure(
        "stripe_evidence_mismatch",
        `Charged price facts do not match snapshot ${item.priceId}`,
      );
    }
    return item;
  });
}

/**
 * Current catalog data is consulted only to prove that durable variant
 * references can still be applied. Mutable price ids and available sizes are
 * intentionally not compared after payment: the checkout intent and Stripe
 * paid line items are the historical authorities for those facts.
 */
export function assertReferencedVariantsExist(
  items: readonly Pick<CheckoutSnapshotItem, "variantId">[],
  variants: readonly ReferencedVariant[],
): void {
  const availableIds = new Set(variants.map((variant) => variant.id));
  const missingVariantId = items.find(
    (item) => !availableIds.has(item.variantId),
  )?.variantId;
  if (missingVariantId !== undefined) {
    throw permanentReconciliationFailure(
      "historical_catalog_identity_missing",
      `Durable checkout references missing variant ${missingVariantId}`,
    );
  }
}

function assertValidSnapshot(snapshot: readonly CheckoutSnapshotItem[]) {
  for (const item of snapshot) {
    if (
      !Number.isSafeInteger(item.cartItemId) ||
      item.cartItemId <= 0 ||
      !Number.isSafeInteger(item.variantId) ||
      item.variantId <= 0 ||
      !item.size ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 ||
      !item.priceId ||
      !Number.isSafeInteger(item.unitAmount) ||
      item.unitAmount < 0 ||
      item.currency.length !== 3
    ) {
      throw permanentReconciliationFailure(
        "durable_snapshot_corrupt",
        "Durable checkout snapshot contains invalid item facts",
      );
    }
  }
}

function collectConsistentPriceFacts(charged: readonly ChargedLineItem[]) {
  const facts = new Map<string, { unitAmount: number; currency: string }>();
  for (const item of charged) {
    const existing = facts.get(item.priceId);
    if (
      existing &&
      (existing.unitAmount !== item.unitAmount ||
        existing.currency.toLowerCase() !== item.currency.toLowerCase())
    ) {
      throw permanentReconciliationFailure(
        "stripe_evidence_mismatch",
        "Stripe line items contain conflicting price facts",
      );
    }
    if (!existing) {
      facts.set(item.priceId, {
        unitAmount: item.unitAmount,
        currency: item.currency,
      });
    }
  }
  return facts;
}

function aggregateQuantity(
  items: readonly { priceId: string; quantity: number }[],
) {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.priceId, (totals.get(item.priceId) ?? 0) + item.quantity);
  }
  return totals;
}
import { permanentReconciliationFailure } from "./retry.ts";
