"use server";

import { ordersRepository } from "@/lib/db/drizzle/repositories";
import Stripe from "stripe";
import { getUser } from "@/lib/auth/server";
import {
  orderWithDetailsSchema,
  insertOrderItemSchema,
  insertCustomerInfoSchema,
  insertOrderProductSchema,
} from "@/lib/db/drizzle/schema";
import type {
  OrderItem,
  CustomerInfo,
  OrderProduct,
  OrderWithDetails,
  MinimalCartItem,
} from "@/lib/db/drizzle/schema";

export const getUserOrders = async (): Promise<OrderWithDetails[] | null> => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      console.info("No user found, returning null");
      return null;
    }

    const orders = await ordersRepository.findByUserId(userId);
    return orderWithDetailsSchema.array().parse(orders);
  } catch (error) {
    console.error("Unexpected error fetching orders:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
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
      console.info("No user found when fetching order");
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

/**
 * Create order item in database
 */
export async function createOrderItem(
  userId: string,
  orderNumber: number,
): Promise<OrderItem> {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);

  const orderItemToSave = insertOrderItemSchema.parse({
    userId,
    deliveryDate,
    orderNumber,
  });

  const order = await ordersRepository.create(orderItemToSave);

  if (!order) {
    throw new Error("Error creating order");
  }

  return order;
}

/**
 * Save customer info from Stripe session
 */
export async function saveCustomerInfo(
  orderId: number,
  session: Stripe.Checkout.Session,
): Promise<CustomerInfo | null> {
  const customerInfoToSave = insertCustomerInfoSchema.parse({
    orderId,
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

  const customerInfo = await ordersRepository.addCustomerInfo(
    orderId,
    customerInfoToSave,
  );

  if (!customerInfo) {
    throw new Error("Error saving customer info");
  }

  return {
    id: customerInfo.id,
    orderId: customerInfo.orderId,
    name: customerInfo.name,
    email: customerInfo.email,
    phone: customerInfo.phone,
    address: customerInfo.address,
    stripeOrderId: customerInfo.stripeOrderId,
    totalPrice: customerInfo.totalPrice,
    createdAt:
      customerInfo.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt:
      customerInfo.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function saveOrderProducts(
  orderId: number,
  lineItems: Stripe.LineItem[],
  cartItems: MinimalCartItem[],
): Promise<OrderProduct[]> {
  const orderProductsData = lineItems
    .map((lineItem) => {
      const cartItem = cartItems.find(
        (item) => item.stripeId === lineItem.price?.id,
      );

      if (!cartItem) {
        console.warn(`No cart item found for price ID: ${lineItem.price?.id}`);
        return null;
      }

      return insertOrderProductSchema.parse({
        orderId,
        variantId: cartItem.variantId,
        quantity: lineItem.quantity || 1,
        size: cartItem.size,
      });
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (orderProductsData.length === 0) {
    throw new Error("No valid order products to save");
  }

  const savedProducts = await ordersRepository.addProducts(
    orderId,
    orderProductsData,
  );

  return savedProducts.map((p) => ({
    id: p.id,
    orderId: p.orderId,
    variantId: p.variantId,
    quantity: p.quantity,
    size: p.size as "XS" | "S" | "M" | "L" | "XL" | "XXL",
    createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: p.updatedAt?.toISOString() ?? new Date().toISOString(),
  }));
}
