export type FulfillmentOrderEvidence = Readonly<{
  userId: string;
  stripeSessionId: string;
  totalPrice: number;
  currency: string;
  products: readonly FulfillmentOrderLineEvidence[];
}>;

export type FulfillmentOrderLineEvidence = Readonly<{
  variantId: number;
  quantity: number;
  size: string;
  unitAmount: number;
  currency: string;
  productName: string;
  variantColor: string;
  imageUrl: string;
}>;

export class ExistingOrderMismatchError extends Error {
  readonly code = "existing_order_mismatch" as const;
  readonly retryable = false;

  constructor() {
    super("The existing Stripe order does not match the paid fulfillment facts");
    this.name = "ExistingOrderMismatchError";
  }
}

function canonicalOrder(evidence: FulfillmentOrderEvidence) {
  return {
    userId: evidence.userId,
    stripeSessionId: evidence.stripeSessionId,
    totalPrice: evidence.totalPrice,
    currency: evidence.currency.toLowerCase(),
    products: evidence.products
      .map((product) => ({
        variantId: product.variantId,
        quantity: product.quantity,
        size: product.size,
        unitAmount: product.unitAmount,
        currency: product.currency.toLowerCase(),
        productName: product.productName,
        variantColor: product.variantColor,
        imageUrl: product.imageUrl,
      }))
      .sort((left, right) => {
        const leftKey = JSON.stringify(left);
        const rightKey = JSON.stringify(right);
        return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
      }),
  };
}

export function assertExistingOrderMatchesFulfillment(
  existing: FulfillmentOrderEvidence,
  expected: FulfillmentOrderEvidence,
): void {
  if (
    JSON.stringify(canonicalOrder(existing)) !==
    JSON.stringify(canonicalOrder(expected))
  ) {
    throw new ExistingOrderMismatchError();
  }
}
