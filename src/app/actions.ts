"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { productsRepository } from "@/lib/db/drizzle/repositories";
import {
  type ProductCategory,
  ProductWithVariantsSchema,
  type ProductWithVariants,
} from "@/schemas";

// Cache for 1 hour, revalidate on demand
const CACHE_REVALIDATE = 3600;

export const getAllProducts = unstable_cache(
  async (): Promise<ProductWithVariants[]> => {
    try {
      const products = await productsRepository.findAll();
      return ProductWithVariantsSchema.array().parse(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },
  ["all-products"],
  { revalidate: CACHE_REVALIDATE, tags: ["products"] }
);

export const getCategoryProducts = unstable_cache(
  async (category: ProductCategory): Promise<ProductWithVariants[]> => {
    try {
      const products = await productsRepository.findByCategory(
        category as ProductCategory
      );
      return ProductWithVariantsSchema.array().parse(products);
    } catch (error) {
      console.error("Error fetching category products:", error);
      return [];
    }
  },
  ["category-products"],
  { revalidate: CACHE_REVALIDATE, tags: ["products"] }
);

export async function getProduct(productId: number): Promise<ProductWithVariants | null> {
  return unstable_cache(
    async (): Promise<ProductWithVariants | null> => {
      try {
        const product = await productsRepository.findById(productId);
        if (!product) return null;
        return ProductWithVariantsSchema.parse(product);
      } catch (error) {
        console.error("Error fetching product:", error);
        return null;
      }
    },
    [`product-${productId}`],
    { revalidate: CACHE_REVALIDATE, tags: ["products", `product-${productId}`] }
  )();
}

export async function getRandomProducts(
  productIdToExclude: number
): Promise<ProductWithVariants[]> {
  try {
    const allProducts = await getAllProducts();
    const filtered = allProducts.filter((p) => p.id !== productIdToExclude);
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return ProductWithVariantsSchema.array().parse(shuffled.slice(0, 6));
  } catch (error) {
    console.error("Error fetching random products:", error);
    return [];
  }
}

/**
 * Revalidates all product caches
 * Call this after creating, updating, or deleting products
 */
export async function revalidateProducts(productId?: number): Promise<void> {
  // Always revalidate the general products tag
  revalidateTag("products", "max");
  
  // If a specific product ID is provided, also revalidate that specific product
  if (productId) {
    revalidateTag(`product-${productId}`, "max");
  }
}
