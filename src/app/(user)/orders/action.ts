"use server";

import { createServiceClient } from "@/utils/supabase/server";
import { CartItem, OrderItem } from "@/schemas/ecommerce";
import Stripe from "stripe";
import { productsWithVariantsQuery } from "@/schemas/ecommerce";
import { getUser } from "@/libs/auth/server";

export const getUserOrders = async () => {
  try {
    const user = await getUser();
    const userId = user?.id;
    if (!userId) return null;

    const supabase = createServiceClient();

    const { data: orders, error } = await supabase
      .from("order_items")
      .select(
        `
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
          products_variants!inner(${productsWithVariantsQuery})
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return orders as OrderItem[];
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    return null;
  }
};

export const getOrder = async (orderId: OrderItem["id"]) => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId) return null;

    const supabase = createServiceClient();

    const { data: order, error } = await supabase
      .from("order_items")
      .select(
        `
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
          products_variants!inner(${productsWithVariantsQuery})
        ),
        customer_info(
          name,
          email,
          phone,
          address,
          stripe_order_id,
          total_price
        )
      `
      )
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    if (!order) {
      console.error("Order not found");
      return null;
    }

    return order as unknown as OrderItem;
  } catch (error) {
    console.error("Error getting order:", error);
    return null;
  }
};

export const saveOrder = async (
  data: Stripe.Checkout.Session,
  cartItems: CartItem[]
) => {
  try {
    const user = await getUser();
    const userId = user?.id;

    if (!userId || !data) {
      console.error("Missing information.");
      return null;
    }

    const supabase = createServiceClient();

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7); // delivery date

    const { data: orderData, error: orderError } = await supabase
      .from("order_items")
      .insert({
        user_id: userId,
        delivery_date: deliveryDate.toISOString(),
        order_number: Math.floor(Math.random() * 1000000), // generate order number
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const { error: customerError } = await supabase
      .from("customer_info")
      .insert({
        order_id: orderData.id,
        name: data.customer_details?.name,
        email: data.customer_details?.email,
        phone: data.customer_details?.phone,
        address: {
          line1: data.customer_details?.address?.line1,
          line2: data.customer_details?.address?.line2,
          city: data.customer_details?.address?.city,
          state: data.customer_details?.address?.state,
          postal_code: data.customer_details?.address?.postal_code,
          country: data.customer_details?.address?.country,
        },
        stripe_order_id: data.id,
        total_price: data.amount_total,
      });

    if (customerError) throw customerError;

    const orderProducts = cartItems.map((item) => ({
      order_id: orderData.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      size: item.size,
    }));

    const { error: productsError } = await supabase
      .from("order_products")
      .insert(orderProducts);

    if (productsError) throw productsError;

    // await clearCart();
  } catch (error) {
    console.error("Error saving the order:", error);
  }
};
