"use server";

import { createClient } from "@/utils/supabase/server";
import type { EnrichedProduct } from "@/schemas/ecommerce";
import { productsWithVariantsQuery } from "@/schemas/ecommerce";
import { getWishlistItems } from "@/app/(carts)/wishlist/action";

export async function getAllProducts(): Promise<EnrichedProduct[]> {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery);

    if (error) throw error;

    const wishlistItems = await getWishlistItems();

    const enrichedProducts = (products as EnrichedProduct[]).map((product) => ({
      ...product,
      wishlist_item: wishlistItems?.find(
        (item) => item.product_id === product.id
      ),
    }));

    return enrichedProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Error fetching products");
  }
}

export async function getCategoryProducts(
  category: string
): Promise<EnrichedProduct[]> {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .eq("category", category);

    if (error) throw error;

    return products as EnrichedProduct[];
  } catch (error) {
    console.error("Error fetching category products:", error);
    throw new Error("Error fetching category products");
  }
}

export async function getRandomProducts(
  productId: number
): Promise<EnrichedProduct[]> {
  try {
    const supabase = await createClient();
    const { data: randomProducts, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .neq("id", productId)
      .order("random()")
      .limit(6);

    if (error) throw error;

    return randomProducts as EnrichedProduct[];
  } catch (error) {
    console.error("Error fetching random products:", error);
    throw new Error("Error fetching random products");
  }
}

export async function getProduct(
  productId: number
): Promise<EnrichedProduct | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .eq("id", productId)
      .maybeSingle();

    if (error) throw error;

    return data as EnrichedProduct | null;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Error fetching product");
  }
}
