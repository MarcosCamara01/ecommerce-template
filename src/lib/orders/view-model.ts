import type { OrderStatus } from "../db/drizzle/schema/orders.ts";
import { formatPriceFromCents } from "../../utils/formatters.ts";

import { orderStatusPresentation } from "./status.ts";

export function orderViewModel(order: {
  status: OrderStatus;
  deliveryDate: string;
  createdAt: string;
  customerInfo: { totalPrice: number };
  orderProducts: Array<{ quantity: number }>;
}) {
  return {
    totalItems: order.orderProducts.reduce(
      (total, product) => total + product.quantity,
      0,
    ),
    totalPrice: formatPriceFromCents(order.customerInfo.totalPrice),
    deliveryDate: new Date(order.deliveryDate),
    // What the order says about delivery: the day it arrived, the day it is
    // expected, or nothing once it is cancelled.
    delivery:
      order.status === "cancelled"
        ? null
        : {
            label: order.status === "delivered" ? "Delivered" : "Expected delivery",
            date: new Date(order.deliveryDate),
          },
    orderDate: new Date(order.createdAt),
    status: orderStatusPresentation(order.status),
  };
}
