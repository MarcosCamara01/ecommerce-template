import { stripe, Stripe } from "@/lib/stripe";
import {
  cartRepository,
  ordersRepository,
} from "@/lib/db/drizzle/repositories";
import { stripeLogger } from "@/lib/stripe/logger";
import type { MinimalCartItem } from "@/lib/db/drizzle/schema/cart";
import {
  createOrderItemInputSchema,
  insertCustomerInfoSchema,
  insertOrderProductSchema,
  type OrderWithDetails,
} from "@/lib/db/drizzle/schema";

export { stripe };

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  try {
    const existing = await stripe.customers.list({ email, limit: 1 });

    if (existing.data.length > 0) {
      return existing.data[0].id;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { userId, source: "ecommerce-template" },
    });

    stripeLogger.info(`Created Stripe customer ${customer.id}`);
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
  replacedPriceId?: string;
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
          replacedPriceId: priceId,
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
    if (!sessionId.startsWith("cs_")) {
      return { status: "not_found", error: "Invalid session" };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

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
    if (
      err instanceof Stripe.errors.StripeError &&
      (err.type === "StripeInvalidRequestError" ||
        err.code === "resource_missing")
    ) {
      return { status: "not_found", error: err.message };
    }

    stripeLogger.error("Error fetching checkout data", err);
    return { status: "error", error: "Could not connect to payment service" };
  }
}

export async function deactivateStripePrice(priceId: string): Promise<boolean> {
  try {
    await stripe.prices.update(priceId, { active: false });
    stripeLogger.info(`Deactivated Stripe price ${priceId}`);
    return true;
  } catch (error) {
    stripeLogger.error("Error deactivating Stripe price", error);
    return false;
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

function buildOrderProductsInput(
  lineItems: Stripe.LineItem[],
  cartItems: MinimalCartItem[],
) {
  const createOrderProductInputSchema = insertOrderProductSchema.omit({
    orderId: true,
  });

  return lineItems
    .map((lineItem) => {
      const cartItem = cartItems.find(
        (item) => item.stripeId === lineItem.price?.id,
      );

      if (!cartItem) {
        stripeLogger.warn("No cart item found for Stripe line item", {
          details: { priceId: lineItem.price?.id },
        });
        return null;
      }

      return createOrderProductInputSchema.parse({
        variantId: cartItem.variantId,
        quantity: lineItem.quantity || 1,
        size: cartItem.size,
      });
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// Idempotent: returns existing order if already processed
export async function processCompletedOrder(
  session: Stripe.Checkout.Session,
): Promise<OrderWithDetails> {
  const existingOrder = await ordersRepository.findByStripeSessionId(
    session.id,
  );
  if (existingOrder) {
    return existingOrder;
  }

  const userId = session.metadata?.userId;
  if (!userId) throw new Error("Missing userId in session metadata");

  const cartItems = await getCartItemsFromMetadata(session.metadata, userId);
  if (!cartItems.length) throw new Error("No cart items found for user");

  const lineItems = await getLineItemsFromSession(session.id);
  if (lineItems.length === 0) throw new Error("No line items from Stripe");

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  const orderData = createOrderItemInputSchema.parse({
    userId,
    deliveryDate,
  });

  const customerData = insertCustomerInfoSchema
    .omit({ orderId: true })
    .parse({
      name: session.customer_details?.name || "Unknown",
      email: session.customer_details?.email || "unknown@email.com",
      phone: session.customer_details?.phone || undefined,
      address: {
        line1: session.customer_details?.address?.line1 || "",
        line2: session.customer_details?.address?.line2,
        city: session.customer_details?.address?.city || "",
        state: session.customer_details?.address?.state,
        postal_code: session.customer_details?.address?.postal_code || "",
        country: session.customer_details?.address?.country || "",
      },
      stripeOrderId: session.id,
      totalPrice: session.amount_total || 0,
    });

  const orderProductsData = buildOrderProductsInput(lineItems, cartItems);
  if (orderProductsData.length === 0) {
    throw new Error("No valid order products to save");
  }

  const savedOrder = await ordersRepository.createComplete(
    orderData,
    customerData,
    orderProductsData,
  );
  if (!savedOrder) {
    throw new Error("Error creating complete order");
  }

  await clearUserCart(userId);
  return savedOrder;
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
