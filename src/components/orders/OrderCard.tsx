/** COMPONENTS */
import Image from "next/image";
import Link from "@/components/ui/link";
import { ArrowRightIcon } from "@/components/icons";
import { OrderSteps } from "./OrderSteps";
/** UTILS */
import { format } from "date-fns";
import { cn } from "@/lib/utils";
/** TYPES */
import type { OrderWithDetails } from "@/lib/db/drizzle/schema";
import { orderViewModel } from "@/lib/orders/view-model";

interface OrderCardProps {
  order: OrderWithDetails;
}

/** Orders list row: up to three photos, number, status, progress, totals. */
export function OrderCard({ order }: OrderCardProps) {
  const { totalItems, totalPrice, delivery, orderDate, status } =
    orderViewModel(order);
  const thumbs = order.orderProducts.slice(0, 3);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="grid items-center gap-5 rounded-photo-lg border border-line bg-fg/5 p-4 transition-colors duration-200 hover:border-fg lg:grid-cols-[260px_minmax(0,1fr)_auto]"
    >
      <div className="flex gap-1.5">
        {thumbs.map((line) => (
          <Image
            key={line.id}
            src={line.imageUrl}
            alt=""
            width={80}
            height={106}
            sizes="80px"
            className="h-24 w-[72px] rounded-field bg-photo object-cover lg:h-[106px] lg:w-20"
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-display-75 text-[28px] font-extrabold leading-none">
              Order #{order.orderNumber}
            </span>
            <span className="text-13 text-muted">
              {format(orderDate, "MMM d, yyyy 'at' h:mm a")}
            </span>
          </div>
          <span
            className={cn(
              "flex h-[30px] items-center rounded-pill px-3 text-13 font-semibold",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
        <OrderSteps step={status.step} labelled={false} className="gap-1" />
        <dl className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
          {delivery ? (
            <div className="flex flex-col">
              <dt className="text-xs text-muted">{delivery.label}</dt>
              <dd className="font-medium">{format(delivery.date, "MMM d, yyyy")}</dd>
            </div>
          ) : null}
          <div className="flex flex-col">
            <dt className="text-xs text-muted">Items</dt>
            <dd className="font-medium tabular-nums">{totalItems}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-muted">Total</dt>
            <dd className="font-semibold tabular-nums">{totalPrice}</dd>
          </div>
        </dl>
      </div>
      <span
        aria-hidden="true"
        className="hidden size-[52px] place-items-center rounded-pill border border-fg lg:grid"
      >
        <ArrowRightIcon />
      </span>
    </Link>
  );
}
