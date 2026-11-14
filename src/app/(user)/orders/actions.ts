"use server";

import { dataAccess } from "@/lib/data-access";
import { requirePrincipal } from "@/lib/identity";
import {
  orderWithDetailsSchema,
  type OrderItem,
  type OrderWithDetails,
} from "@/lib/db/drizzle/schema";

export async function getUserOrders(): Promise<OrderWithDetails[]> {
  const principal = await requirePrincipal();
  return orderWithDetailsSchema
    .array()
    .parse(await dataAccess.forUser(principal).orders.list());
}

export async function getOrder(
  orderId: OrderItem["id"],
): Promise<OrderWithDetails | null> {
  const principal = await requirePrincipal();
  const order = await dataAccess.forUser(principal).orders.find(orderId);
  return order ? orderWithDetailsSchema.parse(order) : null;
}
