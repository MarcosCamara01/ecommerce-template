/** COMPONENTS */
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { OrderSteps } from "./OrderSteps";
/** TYPES */
import type { OrderWithDetails } from "@/lib/db/drizzle/schema";
/** UTILS */
import { format } from "date-fns";
import { orderViewModel } from "@/lib/orders/view-model";
import { formatPriceFromCents } from "@/utils/formatters";

interface OrderSummaryProps {
  order: OrderWithDetails;
}

/** Status, dates, totals and the delivery address for one order. */
export function OrderSummary({ order }: OrderSummaryProps) {
  const { totalItems, totalPrice, delivery, orderDate, status } =
    orderViewModel(order);
  const address = order.customerInfo?.address;
  const delivered = order.status === "delivered";

  return (
    <div className="flex flex-col gap-[22px] rounded-photo-lg border border-line bg-fg/5 p-[22px]">
      <h2 className="text-lg font-semibold">Order status</h2>
      <OrderSteps
        step={status.step}
        // A cancelled order went no further than being placed.
        notes={[
          format(orderDate, "dd MMM"),
          status.step === 2 ? "Now" : "",
          delivery ? "—" : "",
          delivery
            ? `${delivered ? "" : "Est. "}${format(delivery.date, "dd MMM")}`
            : "",
        ]}
      />

      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-line pt-[18px] text-sm tabular-nums">
        <dt className="text-muted">Order number</dt>
        <dd className="text-right font-medium">{order.orderNumber}</dd>
        <dt className="text-muted">Order date</dt>
        <dd className="text-right font-medium">{format(orderDate, "dd MMM yyyy")}</dd>
        {delivery ? (
          <>
            <dt className="text-muted">{delivery.label}</dt>
            <dd className="text-right font-medium">
              {format(delivery.date, "dd MMM yyyy")}
            </dd>
          </>
        ) : null}
        <dt className="text-muted">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </dt>
        <dd className="text-right font-medium">{totalPrice}</dd>
        <dt className="text-muted">Delivery</dt>
        <dd className="text-right font-medium">FREE</dd>
        <dt className="text-muted">Discount</dt>
        <dd className="text-right font-medium">{formatPriceFromCents(0)}</dd>
        <dt className="self-center font-semibold">Total</dt>
        <dd className="text-right">
          <span className="font-display-75 text-[28px] font-extrabold leading-none">
            {totalPrice}
          </span>
          <span className="block text-xs text-muted">(VAT included)</span>
        </dd>
      </dl>

      <div className="flex flex-col gap-1 border-t border-line pt-[18px] text-sm">
        <span className="font-semibold">Delivery address</span>
        <span>{order.customerInfo?.name}</span>
        <span className="text-muted">{address?.line1}</span>
        {address?.line2 ? <span className="text-muted">{address.line2}</span> : null}
        <span className="text-muted">
          {address?.postal_code} {address?.city}
        </span>
        <span className="text-muted">{address?.country}</span>
        {order.customerInfo?.phone ? (
          <span className="mt-2 text-muted">{order.customerInfo.phone}</span>
        ) : null}
        <span className="text-muted">{order.customerInfo?.email}</span>
      </div>

      <Link
        href="/help/delivery"
        className="press flex h-[52px] items-center justify-between rounded-pill border border-fg px-[18px] font-medium"
      >
        <span>Need help with this order?</span>
        <ArrowRightIcon />
      </Link>
    </div>
  );
}
