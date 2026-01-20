/** COMPONENTS */
import Link from "next/link";
/** UTILS */
import { format } from "date-fns";
import { cn } from "@/lib/utils";
/** TYPES */
import type { OrderWithDetails } from "@/schemas";
/** ICONS */
import {
  HiOutlineShoppingBag,
  HiOutlineCalendar,
  HiOutlineCube,
} from "react-icons/hi";

interface OrderCardProps {
  order: OrderWithDetails;
}

export function OrderCard({ order }: OrderCardProps) {
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
    <Link
      href={`/orders/${order.id}`}
      className="group relative overflow-hidden transition-all duration-200 border border-solid rounded-lg border-border-primary bg-background-secondary hover:shadow-lg  hover:border-border-secondary"
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-background-tertiary">
              <HiOutlineCube className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Order #{order.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(orderDate, "dd MMM yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>

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

        {/* Order info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="text-sm font-medium">
                {format(deliveryDate, "dd MMM yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HiOutlineShoppingBag className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">{totalItems}</p>
          </div>
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-border-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{totalPrice} €</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
