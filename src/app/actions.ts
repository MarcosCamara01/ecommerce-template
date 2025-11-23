"use server";

import { createCacheableClient } from "@/lib/db";
import {
  productsWithVariantsQuery,
  ProductWithVariantsSchema,
  type ProductWithVariants,
} from "@/schemas";
import { cacheLife } from "next/cache";

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  "use cache";
  cacheLife("hours");

  try {
    const supabase = createCacheableClient();

    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery);

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return ProductWithVariantsSchema.array().parse(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getCategoryProducts(
  category: string
): Promise<ProductWithVariants[]> {
  "use cache";
  cacheLife("hours");

  try {
    const supabase = createCacheableClient();

    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .eq("category", category);

    if (error) {
      console.error("Error fetching category products:", error);
      return [];
    }

    return ProductWithVariantsSchema.array().parse(products);
  } catch (error) {
    console.error("Error fetching category products:", error);
    return [];
  }
}

export async function getProduct(
  productId: number
): Promise<ProductWithVariants | null> {
  "use cache";
  cacheLife("hours");

  try {
    const supabase = createCacheableClient();

    const { data, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    return ProductWithVariantsSchema.parse(data);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getRandomProducts(
  productIdToExclude: number
): Promise<ProductWithVariants[]> {
  try {
    const supabase = createCacheableClient();

    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .neq("id", productIdToExclude)
      .limit(30);

    if (error) {
      console.error("Error fetching random products:", error);
      return [];
    }

    if (!products || products.length === 0) {
      return [];
    }

    const shuffled = products.sort(() => Math.random() - 0.5);
    return ProductWithVariantsSchema.array().parse(shuffled.slice(0, 6));
  } catch (error) {
    console.error("Error fetching random products:", error);
    return [];
  }
}
