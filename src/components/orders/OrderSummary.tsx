/** TYPES */
import type { OrderWithDetails } from "@/lib/db/drizzle/schema";
/** UTILS */
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatPriceFromCents } from "@/utils/formatters";
/** ICONS */
import {
  HiOutlineCube,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCreditCard,
  HiOutlineTruck,
} from "react-icons/hi";

interface OrderSummaryProps {
  order: OrderWithDetails;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const totalItems = order.orderProducts.reduce(
    (total: number, product: { quantity: number }) => total + product.quantity,
    0,
  );

  const totalPrice = formatPriceFromCents(order.customerInfo?.totalPrice || 0);

  const deliveryDate = new Date(order.deliveryDate);
  const orderDate = new Date(order.createdAt);
  const isUpcoming = deliveryDate > new Date();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-solid border-border-primary bg-background-secondary p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Order Status</h3>
          <div
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              isUpcoming
                ? "bg-color-secondary/20 text-color-secondary"
                : "bg-color-secondary/10 text-color-secondary",
            )}
          >
            {isUpcoming ? "In Transit" : "Delivered"}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Order placed</span>
            <span>{format(orderDate, "dd MMM")}</span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-background-tertiary">
            <div
              className={cn(
                "h-full bg-gradient-to-r from-color-secondary to-color-secondary transition-all duration-300",
                isUpcoming ? "w-3/4" : "w-full",
              )}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Expected delivery</span>
            <span>{format(deliveryDate, "dd MMM")}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-solid border-border-primary bg-background-secondary p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <HiOutlineCube className="h-5 w-5" />
          Order Details
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order Date</span>
            <span className="font-medium">
              {format(orderDate, "dd LLL yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expected Delivery</span>
            <span className="font-medium">
              {format(deliveryDate, "dd LLL yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-solid border-border-primary bg-background-secondary p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <HiOutlineLocationMarker className="h-5 w-5" />
          Delivery Address
        </h3>
        <div className="space-y-2 text-sm">
          <p className="font-medium">{order.customerInfo?.name}</p>
          <p className="text-muted-foreground">
            {order.customerInfo?.address?.line1}
          </p>
          {order.customerInfo?.address?.line2 && (
            <p className="text-muted-foreground">
              {order.customerInfo.address.line2}
            </p>
          )}
          <p className="text-muted-foreground">
            {order.customerInfo?.address?.postal_code}{" "}
            {order.customerInfo?.address?.city}
          </p>
          <p className="text-muted-foreground">
            {order.customerInfo?.address?.country}
          </p>

          <div className="mt-3 space-y-2 border-t border-border-primary pt-3">
            {order.customerInfo?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <HiOutlinePhone className="h-4 w-4" />
                <span>{order.customerInfo.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <HiOutlineMail className="h-4 w-4" />
              <span>{order.customerInfo?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-solid border-border-primary bg-background-secondary p-4">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <HiOutlineCreditCard className="h-5 w-5" />
          Order Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
            <span className="font-medium">{totalPrice}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <HiOutlineTruck className="h-4 w-4" />
              Delivery
            </span>
            <span className="font-medium text-muted-foreground">FREE</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium">{formatPriceFromCents(0)}</span>
          </div>

          <div className="border-t border-border-primary pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold">{totalPrice}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">(VAT included)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
