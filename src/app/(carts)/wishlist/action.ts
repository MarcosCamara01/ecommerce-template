"use server";

import { revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import { supabase } from "@/libs/supabase/server";
import { WishlistItem } from "@/schemas/ecommerce";
import { getUser } from "@/libs/supabase/auth/getUser";

export async function getWishlistItems() {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    return unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("wishlist")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;

        return data as WishlistItem[];
      },
      [`wishlist-${user.id}`],
      {
        tags: [`wishlist-${user.id}`],
        revalidate: 0,
      }
    )();
  } catch (error) {
    console.error("Error getting wishlist items:", error);
    throw error;
  }
}

export async function toggleWishlistItem(
  productId: WishlistItem["product_id"]
) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    const wishlistItems = await getWishlistItems();

    const existingItem = wishlistItems?.find(
      (wishlistItem) => wishlistItem.product_id === productId
    );

    if (existingItem) {
      await removeWishlistItem(existingItem.id);
      return null;
    }

    return await addWishlistItem(productId);
  } catch (error) {
    console.error("Error toggling wishlist item:", error);
    throw error;
  }
}

export async function addWishlistItem(productId: number) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    const { data: newItem, error: insertError } = await supabase
      .from("wishlist")
      .insert({ product_id: productId, user_id: user.id })
      .select("*")
      .single<Required<WishlistItem>>();

    if (insertError) throw insertError;

    revalidateTag(`wishlist-${user.id}`);
    revalidateTag("wishlist-products");
    return newItem;
  } catch (error) {
    console.error("Error adding wishlist item:", error);
    throw error;
  }
}

export async function removeWishlistItem(itemId: WishlistItem["id"]) {
  try {
    const user = await getUser();
    if (!user) throw new Error("User not found");

    const { error: deleteError } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", itemId);

    if (deleteError) throw deleteError;

    revalidateTag(`wishlist-${user.id}`);
    revalidateTag("wishlist-products");
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    throw error;
  }
}
