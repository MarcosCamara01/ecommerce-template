"use server";

import Stripe from "stripe";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customerInfo, orderItems, orderProducts } from "@/lib/db/schema";
import { getUser } from "@/lib/auth/server";
import {
  CustomerInfoSchema,
  OrderItemSchema,
  OrderProductSchema,
  OrderWithDetailsSchema,
} from "@/schemas";
import type {
  CartItem,
  OrderItem,
  CustomerInfo,
  OrderProduct,
} from "@/schemas";

export const getUserOrders = async () => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      console.info("No user found, returning null");
      return null;
    }

    const db = await getDb();
    if (!db) {
      console.error("Database not configured, returning null orders");
      return null;
    }
    const orders = await db.query.orderItems.findMany({
      where: eq(orderItems.user_id, userId),
      orderBy: [desc(orderItems.created_at)],
      with: {
        order_products: {
          with: {
            products_variants: {
              with: { products_items: true },
            },
          },
        },
        customer_info: true,
      },
    });

    return OrderWithDetailsSchema.array().parse(orders || []);
  } catch (error) {
    console.error("Unexpected error fetching orders:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return null;
  }
};

export const getOrder = async (orderId: OrderItem["id"]) => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      console.info("No user found when fetching order");
      return null;
    }

    const db = await getDb();
    if (!db) {
      console.error("Database not configured when fetching order");
      return null;
    }
    const order = await db.query.orderItems.findFirst({
      where: and(eq(orderItems.id, orderId), eq(orderItems.user_id, userId)),
      with: {
        order_products: {
          with: {
            products_variants: {
              with: { products_items: true },
            },
          },
        },
        customer_info: true,
      },
    });

    if (!order) {
      return null;
    }

    return OrderWithDetailsSchema.parse(order);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching order:", errorMessage);
    return null;
  }
};

/**
 * Create order item in database
 */
export async function createOrderItem(
  userId: string,
  orderNumber: number
): Promise<OrderItem> {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  const orderItemToSave = OrderItemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }).parse({
    user_id: userId,
    delivery_date: deliveryDate.toISOString(),
    order_number: orderNumber,
  });

  const db = await getDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const [order] = await db.insert(orderItems).values(orderItemToSave).returning();

  if (!order) {
    throw new Error("Error creating order: no record returned");
  }

  return OrderItemSchema.parse(order);
}

/**
 * Save customer info from Stripe session
 */
export async function saveCustomerInfo(
  orderId: number,
  session: Stripe.Checkout.Session
): Promise<CustomerInfo> {
  const customerInfoToSave = CustomerInfoSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }).parse({
    order_id: orderId,
    name: session.customer_details?.name || "Unknown",
    email: session.customer_details?.email || "unknown@email.com",
    phone: session.customer_details?.phone,
    address: {
      line1: session.customer_details?.address?.line1,
      line2: session.customer_details?.address?.line2,
      city: session.customer_details?.address?.city,
      state: session.customer_details?.address?.state,
      postal_code: session.customer_details?.address?.postal_code,
      country: session.customer_details?.address?.country,
    },
    stripe_order_id: session.id,
    total_price: session.amount_total || 0,
  });

  const db = await getDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const [saved] = await db.insert(customerInfo).values(customerInfoToSave).returning();

  if (!saved) {
    throw new Error("Error saving customer info: no record returned");
  }

  return CustomerInfoSchema.parse(saved);
}

/**
 * Match Stripe line items with cart items and create order products
 * Returns order products that were saved
 */
export async function saveOrderProducts(
  orderId: number,
  lineItems: Stripe.LineItem[],
  cartItems: CartItem[]
): Promise<OrderProduct[]> {
  const orderProductsData = lineItems
    .map((lineItem) => {
      const cartItem = cartItems.find(
        (item) => item.stripe_id === lineItem.price?.id
      );

      if (!cartItem) {
        console.warn(`No cart item found for price ID: ${lineItem.price?.id}`);
        return null;
      }

      return {
        order_id: orderId,
        variant_id: cartItem.variant_id,
        quantity: lineItem.quantity || 1,
        size: cartItem.size,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderProductsData.length === 0) {
    throw new Error("No valid order products to save");
  }

  const validatedOrderProducts = OrderProductSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  })
    .array()
    .parse(orderProductsData);

  const db = await getDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const saved = await db
    .insert(orderProducts)
    .values(validatedOrderProducts)
    .returning();

  return OrderProductSchema.array().parse(saved);
}
