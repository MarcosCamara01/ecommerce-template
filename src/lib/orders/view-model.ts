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
    orderDate: new Date(order.createdAt),
    status: orderStatusPresentation(order.status),
  };
}
