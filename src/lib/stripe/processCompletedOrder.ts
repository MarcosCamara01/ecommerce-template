"use server";

import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import { CartItemSchema } from "@/schemas";
import type { OrderDetails } from "@/lib/email";
import {
  createOrderItem,
  saveCustomerInfo,
  saveOrderProducts,
} from "@/app/(user)/orders/action";
import { getStripe } from "./client";

/**
 * Get line items from Stripe checkout session
 */
async function getLineItemsFromSession(
  sessionId: string
): Promise<Stripe.LineItem[]> {
  const stripe = await getStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ["data.price.product"],
  });

  if (!lineItems.data || lineItems.data.length === 0) {
    console.error("No line items found in session");
    return [];
  }

  return lineItems.data;
}

/**
 * Clear user's cart after successful order
 */
async function clearUserCart(userId: string) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    await db.delete(cartItems).where(eq(cartItems.user_id, userId));
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}

/**
 * Main function: Save complete order
 * Handles the entire process of creating an order in the database
 * Returns complete order details including products for email
 */
export async function processCompletedOrder(
  session: Stripe.Checkout.Session
): Promise<OrderDetails> {
  try {
    const userId = session.metadata?.userId;
    const cartItems = CartItemSchema.array().parse(
      JSON.parse(session.metadata?.cartItems || "[]")
    );

    if (!userId) {
      throw new Error("Missing userId in session metadata");
    }

    if (!cartItems.length) {
      throw new Error("No cart items in session metadata");
    }

    const lineItems = await getLineItemsFromSession(session.id);

    if (lineItems.length === 0) {
      throw new Error("No line items from Stripe");
    }

    const orderNumber = Math.floor(Math.random() * 1000000);

    const orderData = await createOrderItem(userId, orderNumber);
    const savedCustomerInfo = await saveCustomerInfo(orderData.id, session);
    const savedOrderProducts = await saveOrderProducts(
      orderData.id,
      lineItems,
      cartItems
    );
    await clearUserCart(userId);

    return {
      order: orderData,
      customer_info: savedCustomerInfo,
      products: savedOrderProducts,
    };
  } catch (error) {
    console.error("Error in saveOrderFromStripeWebhook:", error);
    throw error;
  }
}
