export const orderStatuses = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

/** The four steps of the order progress bar, in order. */
export const orderSteps = ["Confirmed", "Processing", "Shipped", "Delivered"] as const;

const ACTIVE_CHIP = "border border-fg bg-fg text-bg";
const SETTLED_CHIP = "border border-fg text-fg";

const presentations: Record<
  OrderStatus,
  { label: string; step: number; className: string }
> = {
  confirmed: { label: "Confirmed", step: 1, className: ACTIVE_CHIP },
  processing: { label: "Processing", step: 2, className: ACTIVE_CHIP },
  shipped: { label: "Shipped", step: 3, className: ACTIVE_CHIP },
  // Finished states read as an outline: nothing is moving any more.
  delivered: { label: "Delivered", step: 4, className: SETTLED_CHIP },
  cancelled: { label: "Cancelled", step: 0, className: SETTLED_CHIP },
};

export function orderStatusPresentation(status: OrderStatus) {
  return presentations[status];
}
