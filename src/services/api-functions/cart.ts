// Cart API service

import { createClient } from "@/lib/db";
import type { CartItem } from "@/schemas";

export async function getCart(userId: string): Promise<CartItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

export async function addToCart(
  userId: string,
  cartItem: Omit<CartItem, "id" | "created_at" | "updated_at" | "user_id">
): Promise<CartItem | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cart_items")
      .insert([{ ...cartItem, user_id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return null;
  }
}

export async function removeFromCart(cartItemId: number): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number
): Promise<CartItem | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
}

export async function clearCart(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
}
