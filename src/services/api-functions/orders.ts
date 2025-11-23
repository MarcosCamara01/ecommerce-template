// Orders API service

import { createServiceClient } from "@/lib/db";
import type { OrderItem } from "@/schemas";

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

export async function getUserOrders(userId: string): Promise<OrderItem[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("order_items")
      .select(ORDER_SELECT_QUERY)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function getOrderById(orderId: number): Promise<OrderItem | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("order_items")
      .select(ORDER_SELECT_QUERY)
      .eq("id", orderId)
      .single();

    if (error) throw error;
    return data;
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
    const supabase = createServiceClient();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const { data, error } = await supabase
      .from("order_items")
      .insert([
        {
          user_id: userId,
          order_number: orderNumber,
          delivery_date: deliveryDate.toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}
