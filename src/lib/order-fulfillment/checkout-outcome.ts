export type CustomerEmailOutcome = "delayed" | "queued" | "sent";
export type CartCleanupOutcome = "delayed" | "pending" | "succeeded";

export type CheckoutOutcome =
  | { status: "fulfillment_pending" }
  | { status: "needs_attention" }
  | {
      status: "fulfilled";
      orderId: number;
      customerEmail: CustomerEmailOutcome;
      cartCleanup: CartCleanupOutcome;
    };

export type CheckoutOutcomeRecord = Readonly<{
  workState: "pending" | "processing" | "succeeded" | "needs_attention" | null;
  orderId: number | null;
  customerEmailState:
    | "pending"
    | "processing"
    | "succeeded"
    | "needs_attention"
    | null;
  customerEmailLastErrorCode: string | null;
  cartCleanupState:
    | "pending"
    | "processing"
    | "succeeded"
    | "needs_attention"
    | null;
}>;

export function checkoutOutcomeFromRecord(
  record: CheckoutOutcomeRecord,
): CheckoutOutcome {
  if (record.workState === "needs_attention") {
    return { status: "needs_attention" };
  }
  if (record.workState !== "succeeded") {
    return { status: "fulfillment_pending" };
  }
  if (record.orderId === null) {
    throw new Error("Fulfillment succeeded without a durable order");
  }

  const customerEmail: CustomerEmailOutcome =
    record.customerEmailState === "succeeded"
      ? "sent"
      : record.customerEmailState === "needs_attention" ||
          record.customerEmailLastErrorCode
        ? "delayed"
        : "queued";
  const cartCleanup: CartCleanupOutcome =
    record.cartCleanupState === "succeeded"
      ? "succeeded"
      : record.cartCleanupState === "needs_attention"
        ? "delayed"
        : "pending";

  return {
    status: "fulfilled",
    orderId: record.orderId,
    customerEmail,
    cartCleanup,
  };
}
