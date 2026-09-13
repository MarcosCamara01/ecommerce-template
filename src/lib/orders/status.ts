export const orderStatuses = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

const presentations: Record<
  OrderStatus,
  { label: string; progress: string; className: string }
> = {
  confirmed: {
    label: "Confirmed",
    progress: "w-1/4",
    className: "bg-color-secondary/20 text-color-secondary",
  },
  processing: {
    label: "Processing",
    progress: "w-1/2",
    className: "bg-color-secondary/20 text-color-secondary",
  },
  shipped: {
    label: "Shipped",
    progress: "w-3/4",
    className: "bg-color-secondary/20 text-color-secondary",
  },
  delivered: {
    label: "Delivered",
    progress: "w-full",
    className: "bg-emerald-500/15 text-emerald-300",
  },
  cancelled: {
    label: "Cancelled",
    progress: "w-0",
    className: "bg-red-500/15 text-red-300",
  },
};

export function orderStatusPresentation(status: OrderStatus) {
  return presentations[status];
}
