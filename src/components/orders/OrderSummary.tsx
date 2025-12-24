/** TYPES */
import type { OrderWithDetails } from "@/schemas";
/** UTILS */
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
    0
  );

  const rawPrice = order.customerInfo?.totalPrice || 0;
  const totalPrice = rawPrice > 0 ? (rawPrice / 100).toFixed(2) : "0.00";

  const deliveryDate = new Date(order.deliveryDate);
  const orderDate = new Date(order.createdAt);
  const isUpcoming = deliveryDate > new Date();

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Order Status</h3>
          <div
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full",
              isUpcoming
                ? "bg-color-secondary/20 text-color-secondary"
                : "bg-color-secondary/10 text-color-secondary"
            )}
          >
            {isUpcoming ? "In Transit" : "Delivered"}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Order placed</span>
            <span>{format(orderDate, "dd MMM")}</span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-background-tertiary">
            <div
              className={cn(
                "h-full bg-gradient-to-r from-color-secondary to-color-secondary transition-all duration-300",
                isUpcoming ? "w-3/4" : "w-full"
              )}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Expected delivery</span>
            <span>{format(deliveryDate, "dd MMM")}</span>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <HiOutlineCube className="w-5 h-5" />
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

      {/* Delivery Address */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <HiOutlineLocationMarker className="w-5 h-5" />
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

          <div className="pt-3 mt-3 space-y-2 border-t border-border-primary">
            {order.customerInfo?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <HiOutlinePhone className="w-4 h-4" />
                <span>{order.customerInfo.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <HiOutlineMail className="w-4 h-4" />
              <span>{order.customerInfo?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <HiOutlineCreditCard className="w-5 h-5" />
          Order Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
            <span className="font-medium">{totalPrice} €</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <HiOutlineTruck className="w-4 h-4" />
              Delivery
            </span>
            <span className="font-medium text-muted-foreground">FREE</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-medium">0 €</span>
          </div>

          <div className="pt-3 border-t border-border-primary">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-bold">{totalPrice} €</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">(VAT included)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
