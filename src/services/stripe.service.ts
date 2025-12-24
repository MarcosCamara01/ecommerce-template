import { stripe, Stripe } from "@/lib/stripe";
import {
  cartRepository,
  ordersRepository,
} from "@/lib/db/drizzle/repositories";
import { CartItemSchema } from "@/schemas";
import { stripeLogger } from "@/lib/stripe/logger";
import type { OrderDetails } from "@/lib/email";
import {
  createOrderItem,
  saveCustomerInfo,
  saveOrderProducts,
} from "@/app/(user)/orders/action";

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
    stripeLogger.error("Error obtaining checkout data", err);
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
    return [];
  }

  return lineItems.data;
}

async function clearUserCart(userId: string) {
  try {
    await cartRepository.clearByUserId(userId);
  } catch (error) {
    stripeLogger.error("Error clearing cart", error);
  }
}

/**
 * Processes a completed checkout session with idempotency check.
 */
export async function processCompletedOrder(
  session: Stripe.Checkout.Session
): Promise<OrderDetails> {
  const existingOrder = await ordersRepository.findByStripeSessionId(
    session.id
  );
  if (existingOrder) {
    return {
      order: {
        id: existingOrder.id,
        userId: existingOrder.userId,
        orderNumber: existingOrder.orderNumber,
        deliveryDate: existingOrder.deliveryDate,
        createdAt: existingOrder.createdAt,
        updatedAt: existingOrder.updatedAt,
      },
      customerInfo: existingOrder.customerInfo,
      products: existingOrder.orderProducts.map((op) => ({
        id: op.id,
        orderId: op.orderId,
        variantId: op.variantId,
        quantity: op.quantity,
        size: op.size,
        createdAt: op.createdAt,
        updatedAt: op.updatedAt,
      })),
    };
  }

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

  const orderNumber = await ordersRepository.getNextOrderNumber();

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
