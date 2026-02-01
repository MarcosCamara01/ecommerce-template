import { stripe, Stripe } from "@/lib/stripe";
import {
  cartRepository,
  ordersRepository,
} from "@/lib/db/drizzle/repositories";
import { stripeLogger } from "@/lib/stripe/logger";
import type { OrderDetails } from "@/lib/email";
import {
  createOrderItem,
  saveCustomerInfo,
  saveOrderProducts,
} from "@/app/(user)/orders/action";
import type { MinimalCartItem } from "@/lib/db/drizzle/schema/cart";

export { stripe };

const customerIdCache = new Map<string, string>();

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const cachedId = customerIdCache.get(userId);
  if (cachedId) return cachedId;

  try {
    const existing = await stripe.customers.list({ email, limit: 1 });

    if (existing.data.length > 0) {
      const customerId = existing.data[0].id;
      customerIdCache.set(userId, customerId);
      return customerId;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { userId, source: "ecommerce-template" },
    });

    stripeLogger.info(`Created Stripe customer ${customer.id}`);
    customerIdCache.set(userId, customer.id);
    return customer.id;
  } catch (error) {
    stripeLogger.error("Failed to get/create Stripe customer", error);
    throw error;
  }
}

// Parse cart item IDs from metadata
function parseCartItemIds(cartItemIdsStr: string): number[] {
  if (!cartItemIdsStr) return [];
  return cartItemIdsStr.split(",").map((id) => parseInt(id, 10));
}

export interface CreateStripeProductParams {
  productName: string;
  variantColor: string;
  description?: string;
  price: number;
  images?: string[];
  metadata?: Record<string, string>;
}

export interface StripeProductResult {
  productId: string;
  priceId: string;
}

export async function createStripeProductForVariant(
  params: CreateStripeProductParams,
): Promise<StripeProductResult> {
  const { productName, variantColor, description, price, images, metadata } =
    params;

  const stripeProduct = await stripe.products.create({
    name: `${productName} - ${variantColor}`,
    description: description || undefined,
    images: images?.slice(0, 8) || [],
    metadata: {
      variant_color: variantColor,
      ...metadata,
    },
  });

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(price * 100),
    currency: "eur",
  });

  stripeLogger.info(
    `Created Stripe product ${stripeProduct.id} with price ${stripePrice.id} for variant ${variantColor}`,
  );

  return {
    productId: stripeProduct.id,
    priceId: stripePrice.id,
  };
}

export async function updateStripeProduct(
  priceId: string,
  params: Partial<CreateStripeProductParams>,
): Promise<StripeProductResult | null> {
  try {
    const existingPrice = await stripe.prices.retrieve(priceId);
    const productId = existingPrice.product as string;

    const updateData: Stripe.ProductUpdateParams = {};

    if (params.productName && params.variantColor) {
      updateData.name = `${params.productName} - ${params.variantColor}`;
    }
    if (params.description !== undefined) {
      updateData.description = params.description || undefined;
    }
    if (params.images) {
      updateData.images = params.images.slice(0, 8);
    }
    if (params.metadata) {
      updateData.metadata = {
        variant_color: params.variantColor || "",
        ...params.metadata,
      };
    }

    if (Object.keys(updateData).length > 0) {
      await stripe.products.update(productId, updateData);
    }

    if (params.price !== undefined) {
      const existingAmount = existingPrice.unit_amount || 0;
      const newAmount = Math.round(params.price * 100);

      if (existingAmount !== newAmount) {
        await stripe.prices.update(priceId, { active: false });

        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: newAmount,
          currency: "eur",
        });

        stripeLogger.info(
          `Updated Stripe product ${productId} with new price ${newPrice.id}`,
        );

        return {
          productId,
          priceId: newPrice.id,
        };
      }
    }

    return {
      productId,
      priceId,
    };
  } catch (error) {
    stripeLogger.error("Error updating Stripe product", error);
    return null;
  }
}

export async function archiveStripeProduct(priceId: string): Promise<boolean> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    const productId = price.product as string;

    const prices = await stripe.prices.list({ product: productId });
    for (const p of prices.data) {
      await stripe.prices.update(p.id, { active: false });
    }

    await stripe.products.update(productId, { active: false });

    stripeLogger.info(`Archived Stripe product ${productId}`);
    return true;
  } catch (error) {
    stripeLogger.error("Error archiving Stripe product", error);
    return false;
  }
}

export type CheckoutStatus =
  | "success"
  | "pending"
  | "expired"
  | "canceled"
  | "failed"
  | "not_found"
  | "error";

export interface CheckoutResult {
  status: CheckoutStatus;
  session?: Stripe.Checkout.Session;
  error?: string;
}

export async function fetchCheckoutData(
  sessionId: string,
): Promise<CheckoutResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout_sessions?session_id=${sessionId}`,
    );

    if (!res.ok) {
      if (res.status === 404) {
        return { status: "not_found", error: "Session not found" };
      }
      return { status: "error", error: `Server error: ${res.status}` };
    }

    const data = await res.json();

    // API returns error object on invalid session
    if ("statusCode" in data && data.statusCode === 500) {
      return { status: "not_found", error: data.message || "Invalid session" };
    }

    const session = data as Stripe.Checkout.Session;

    // Map Stripe session status to our status
    if (session.status === "complete" && session.payment_status === "paid") {
      return { status: "success", session };
    }

    if (session.status === "expired") {
      return { status: "expired", session };
    }

    if (session.payment_status === "unpaid") {
      return { status: "canceled", session };
    }

    if (session.status === "open") {
      return { status: "pending", session };
    }

    return { status: "failed", session };
  } catch (err) {
    stripeLogger.error("Error fetching checkout data", err);
    return { status: "error", error: "Could not connect to payment service" };
  }
}

async function getLineItemsFromSession(
  sessionId: string,
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

// Fetch cart items from DB using IDs stored in metadata
async function getCartItemsFromMetadata(
  metadata: Stripe.Metadata | null,
  userId: string,
): Promise<MinimalCartItem[]> {
  if (!metadata?.cartItemIds) return [];

  const cartItemIds = parseCartItemIds(metadata.cartItemIds);
  if (cartItemIds.length === 0) return [];

  const userCartItems = await cartRepository.findByUserId(userId);

  return userCartItems
    .filter((item) => cartItemIds.includes(item.id))
    .map((item) => ({
      variantId: item.variantId,
      size: item.size,
      quantity: item.quantity,
      stripeId: item.stripeId,
    }));
}

// Idempotent: returns existing order if already processed
export async function processCompletedOrder(
  session: Stripe.Checkout.Session,
): Promise<OrderDetails> {
  const existingOrder = await ordersRepository.findByStripeSessionId(
    session.id,
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
  if (!userId) throw new Error("Missing userId in session metadata");

  const cartItems = await getCartItemsFromMetadata(session.metadata, userId);
  if (!cartItems.length) throw new Error("No cart items found for user");

  const lineItems = await getLineItemsFromSession(session.id);
  if (lineItems.length === 0) throw new Error("No line items from Stripe");

  const orderNumber = await ordersRepository.getNextOrderNumber();
  const orderData = await createOrderItem(userId, orderNumber);
  const savedCustomerInfo = await saveCustomerInfo(orderData.id, session);
  const savedOrderProducts = await saveOrderProducts(
    orderData.id,
    lineItems,
    cartItems,
  );
  await clearUserCart(userId);

  return {
    order: orderData,
    customerInfo: savedCustomerInfo!,
    products: savedOrderProducts,
  };
}

// Hook for abandoned cart recovery (analytics, emails, etc.)
export async function handleExpiredSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const customerEmail =
    session.customer_details?.email || session.customer_email;

  stripeLogger.info("Session expired", {
    sessionId: session.id,
    details: {
      userId: session.metadata?.userId,
      customerEmail,
      amount: session.amount_total,
    },
  });

  // TODO: Implement abandoned cart email / analytics
}
