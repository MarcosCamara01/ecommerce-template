"use server";

import { createCacheableClient } from "@/utils/supabase/server";
import {
  productsWithVariantsQuery,
  ProductWithVariantsSchema,
} from "@/schemas/ecommerce";
import { unstable_cache } from "next/cache";
import type { ProductWithVariants } from "@/schemas/ecommerce";

// Cache time in seconds (1 hour)
const CACHE_TIME = 3600;

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const getAllProductsWithCache = unstable_cache(
    async () => {
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
    },
    ["products-list"],
    {
      revalidate: CACHE_TIME,
      tags: ["products"],
    }
  );

  return getAllProductsWithCache();
}

export async function getCategoryProducts(
  category: string
): Promise<ProductWithVariants[]> {
  const getCategoryProductsWithCache = unstable_cache(
    async () => {
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
    },
    ["products-by-category", category],
    {
      revalidate: CACHE_TIME,
      tags: ["products"],
    }
  );

  return getCategoryProductsWithCache();
}

export async function getRandomProducts(
  productIdToExclude: number
): Promise<ProductWithVariants[]> {
  const getRandomProductsWithCache = unstable_cache(
    async () => {
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
    },
    ["random-products", productIdToExclude.toString()],
    {
      revalidate: CACHE_TIME,
      tags: ["products"],
    }
  );

  return getRandomProductsWithCache();
}

export async function getProduct(
  productId: number
): Promise<ProductWithVariants | null> {
  const getProductWithCache = unstable_cache(
    async () => {
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
    },
    ["product-detail", productId.toString()],
    {
      revalidate: CACHE_TIME,
      tags: ["products"],
    }
  );

  return getProductWithCache();
}
