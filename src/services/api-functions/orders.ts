"use server";

// Orders API service

import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { orderItems } from "@/lib/db/schema";
import {
  OrderItemSchema,
  OrderWithDetailsSchema,
  type OrderItem,
} from "@/schemas";

export async function getUserOrders(userId: string): Promise<OrderItem[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const orders = await db.query.orderItems.findMany({
      where: eq(orderItems.user_id, userId),
      orderBy: [desc(orderItems.created_at)],
      with: {
        order_products: {
          with: { products_variants: { with: { products_items: true } } },
        },
        customer_info: true,
      },
    });

    return OrderWithDetailsSchema.array().parse(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function getOrderById(orderId: number): Promise<OrderItem | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const order = await db.query.orderItems.findFirst({
      where: eq(orderItems.id, orderId),
      with: {
        order_products: {
          with: { products_variants: { with: { products_items: true } } },
        },
        customer_info: true,
      },
    });

    return order ? OrderWithDetailsSchema.parse(order) : null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function createOrder(
  userId: string,
  orderNumber: number
): Promise<OrderItem | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const [order] = await db
      .insert(orderItems)
      .values({
        user_id: userId,
        order_number: orderNumber,
        delivery_date: deliveryDate.toISOString(),
      })
      .returning();

    return order ? OrderItemSchema.parse(order) : null;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}
