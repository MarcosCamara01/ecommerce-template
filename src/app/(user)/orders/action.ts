"use server";

import { createServiceClient } from "@/lib/db";
import Stripe from "stripe";
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

const ORDER_SELECT_QUERY = `
  id, 
  user_id, 
  delivery_date, 
  order_number, 
  created_at, 
  updated_at,
  order_products(
    id, 
    order_id, 
    variant_id, 
    quantity, 
    size,
    created_at,
    updated_at,
    products_variants!inner(
      id,
      stripe_id,
      product_id,
      color,
      sizes,
      images,
      created_at,
      updated_at,
      products_items!inner(
        id,
        name,
        description,
        price,
        category,
        img,
        created_at,
        updated_at
      )
    )
  ),
  customer_info(
    id,
    order_id,
    name,
    email,
    phone,
    address,
    stripe_order_id,
    total_price,
    created_at,
    updated_at
  )
`;

export const getUserOrders = async () => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      console.info("No user found, returning null");
      return null;
    }

    const supabase = createServiceClient();

    const { data: orders, error } = await supabase
      .from("order_items")
      .select(ORDER_SELECT_QUERY)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching orders:", error);
      return null;
    }

    const transformedOrders = OrderWithDetailsSchema.array().parse(
      orders || []
    );

    return transformedOrders;
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

    const supabase = createServiceClient();

    const { data: order, error } = await supabase
      .from("order_items")
      .select(ORDER_SELECT_QUERY)
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Supabase error fetching order:", error);
      return null;
    }

    const transformedOrder = OrderWithDetailsSchema.parse(order);

    return transformedOrder;
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
  const supabase = createServiceClient();

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

  const { data, error } = await supabase
    .from("order_items")
    .insert(orderItemToSave)
    .select()
    .single();

  if (error) {
    console.error("Error creating order:", error);
    throw new Error(`Error creating order: ${error.message}`);
  }

  return OrderItemSchema.parse(data);
}

/**
 * Save customer info from Stripe session
 */
export async function saveCustomerInfo(
  orderId: number,
  session: Stripe.Checkout.Session
): Promise<CustomerInfo> {
  const supabase = createServiceClient();

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

  const { data, error } = await supabase
    .from("customer_info")
    .insert(customerInfoToSave)
    .select()
    .single();

  if (error) {
    console.error("Error saving customer info:", error);
    throw new Error(`Error saving customer info: ${error.message}`);
  }

  const customerInfo = CustomerInfoSchema.parse(data);

  return customerInfo;
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

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("order_products")
    .insert(validatedOrderProducts)
    .select();

  const orderProducts = OrderProductSchema.array().parse(data);

  if (error) {
    console.error("Error saving order products:", error);
    throw new Error(`Error saving order products: ${error.message}`);
  }

  return orderProducts;
}
