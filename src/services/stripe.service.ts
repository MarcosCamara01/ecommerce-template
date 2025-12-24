import Stripe from "stripe";
import { cartRepository } from "@/lib/db/drizzle/repositories";
import { CartItemSchema } from "@/schemas";
import type { OrderDetails } from "@/lib/email";
import {
  createOrderItem,
  saveCustomerInfo,
  saveOrderProducts,
} from "@/app/(user)/orders/action";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover" as any,
});

export { stripe };

export async function fetchCheckoutData(
  sessionId: string
): Promise<Stripe.Checkout.Session | undefined> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout_sessions?session_id=${sessionId}`
    ).then((res) => res.json());
    return response;
  } catch (err) {
    console.error("Error obtaining checkout data:", err);
    return undefined;
  }
}

async function getLineItemsFromSession(
  sessionId: string
): Promise<Stripe.LineItem[]> {
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ["data.price.product"],
  });

  if (!lineItems.data || lineItems.data.length === 0) {
    console.error("No line items found in session");
    return [];
  }

  return lineItems.data;
}

async function clearUserCart(userId: string) {
  try {
    await cartRepository.clearByUserId(userId);
  } catch (error) {
    console.error("Error clearing cart:", error);
  }
}

/**
 * Processes a completed Stripe checkout session.
 * Creates order, saves customer info and products, then clears the cart.
 */
export async function processCompletedOrder(
  session: Stripe.Checkout.Session
): Promise<OrderDetails> {
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
    customerInfo: savedCustomerInfo!,
    products: savedOrderProducts,
  };
}
