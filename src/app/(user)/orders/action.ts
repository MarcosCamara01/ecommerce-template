"use server";

import { getUser } from "@/lib/auth/server";
import { ordersRepository } from "@/lib/db/drizzle/repositories";
import {
  orderWithDetailsSchema,
  type OrderItem,
  type OrderWithDetails,
} from "@/lib/db/drizzle/schema";

export const getUserOrders = async (): Promise<OrderWithDetails[] | null> => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      return null;
    }

    const orders = await ordersRepository.findByUserId(userId);
    return orderWithDetailsSchema.array().parse(orders);
  } catch (error) {
    console.error("Unexpected error fetching orders:", error);
    return null;
  }
};

export const getOrder = async (
  orderId: OrderItem["id"],
): Promise<OrderWithDetails | null> => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      return null;
    }

    const order = await ordersRepository.findById(orderId);

    if (!order || order.userId !== userId) {
      return null;
    }

    return orderWithDetailsSchema.parse(order);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching order:", errorMessage);
    return null;
  }
};
