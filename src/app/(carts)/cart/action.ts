"use server";

import { revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import { CartItem } from "@/schemas/ecommerce";
import { supabase } from "@/libs/supabase/server";
import { getUser } from "@/libs/supabase/auth/getUser";

export async function getCartItems() {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    return unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;

        return data as CartItem[];
      },
      [`cart-${user.id}`],
      {
        tags: [`cart-${user.id}`],
        revalidate: 0,
      }
    )();
  } catch (error) {
    console.error("Error getting cart items:", error);
    throw error;
  }
}

export async function addCartItem(
  item: Omit<
    CartItem,
    "quantity" | "user_id" | "id" | "created_at" | "updated_at"
  >
) {
  const user = await getUser();
  if (!user) throw new Error("User not found");

  try {
    const cartItems = await getCartItems();

    const existingItem = cartItems?.find(
      (cartItem) =>
        cartItem.variant_id === item.variant_id && cartItem.size === item.size
    );

    if (existingItem) {
      return editCartItem({
        id: existingItem.id,
        quantity: existingItem.quantity + 1,
      });
    }

    const { data: newItem, error: insertError } = await supabase
      .from("cart_items")
      .insert({
        ...item,
        quantity: 1,
        user_id: user.id,
      })
      .select("*")
      .single<Required<CartItem>>();

    if (insertError) throw insertError;

    revalidateTag(`cart-${user.id}`);
    return newItem;
  } catch (error) {
    console.error("Error adding cart item:", error);
    throw error;
  }
}

export async function editCartItem(update: Partial<CartItem>) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    const { data, error } = await supabase
      .from("cart_items")
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.id)
      .select("id, user_id")
      .single<Required<Pick<CartItem, "id" | "user_id">>>();

    if (error) throw error;

    revalidateTag(`cart-${data.user_id}`);
    return data;
  } catch (error) {
    console.error("Error editing cart item:", error);
    throw error;
  }
}

export async function removeCartItem(itemId: CartItem["id"]) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) throw deleteError;

    revalidateTag(`cart-${user.id}`);
  } catch (error) {
    console.error("Error removing cart item:", error);
    throw error;
  }
}

export async function getTotalItems() {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    return unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("user_id", user.id);

        if (error) throw error;

        return data.reduce((sum, item) => sum + item.quantity, 0);
      },
      [`cart-total-${user.id}`],
      {
        tags: [`cart-${user.id}`],
        revalidate: 0,
      }
    )();
  } catch (error) {
    console.error("Error getting total items:", error);
    throw error;
  }
}

export async function clearCart() {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    revalidateTag(`cart-${user.id}`);
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
}
