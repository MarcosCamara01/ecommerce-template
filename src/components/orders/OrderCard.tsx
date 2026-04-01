/** COMPONENTS */
import Link from "next/link";
/** UTILS */
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatPriceFromCents } from "@/utils/formatters";
/** TYPES */
import type { OrderWithDetails } from "@/lib/db/drizzle/schema";
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
    0,
  );

  const totalPrice = formatPriceFromCents(order.customerInfo?.totalPrice || 0);

  const deliveryDate = new Date(order.deliveryDate);
  const orderDate = new Date(order.createdAt);
  const isUpcoming = deliveryDate > new Date();

  return (
    <Link
      href={`/orders/${order.id}`}
      className="group relative overflow-hidden rounded-lg border border-solid border-border-primary bg-background-secondary transition-all duration-200 hover:border-border-secondary hover:shadow-lg"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-background-tertiary p-2">
              <HiOutlineCube className="h-5 w-5 text-foreground" />
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
              "rounded-full px-3 py-1 text-xs font-semibold",
              isUpcoming
                ? "bg-color-secondary/20 text-color-secondary"
                : "bg-color-secondary/10 text-color-secondary",
            )}
          >
            {isUpcoming ? "In Transit" : "Delivered"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="text-sm font-medium">
                {format(deliveryDate, "dd MMM yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HiOutlineShoppingBag className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">{totalItems}</p>
          </div>
        </div>

        <div className="border-t border-border-primary pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{totalPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
