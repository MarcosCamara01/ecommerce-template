// Products API service

import { createCacheableClient } from "@/lib/db";
import type { Product, ProductWithVariants } from "@/schemas";

const PRODUCTS_QUERY = `*, variants:products_variants(*)`;

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  try {
    const supabase = createCacheableClient();
    const { data, error } = await supabase
      .from("products_items")
      .select(PRODUCTS_QUERY);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(
  id: number
): Promise<ProductWithVariants | null> {
  try {
    const supabase = createCacheableClient();
    const { data, error } = await supabase
      .from("products_items")
      .select(PRODUCTS_QUERY)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductsByCategory(
  category: string
): Promise<ProductWithVariants[]> {
  try {
    const supabase = createCacheableClient();
    const { data, error } = await supabase
      .from("products_items")
      .select(PRODUCTS_QUERY)
      .eq("category", category);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product | null> {
  try {
    const supabase = await createCacheableClient();
    const { data, error } = await supabase
      .from("products_items")
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
}
