"use server";

import { unstable_cache } from "next/cache";
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

export const getProduct = unstable_cache(
  async (productId: number): Promise<ProductWithVariants | null> => {
    try {
      const product = await productsRepository.findById(productId);
      if (!product) return null;
      return ProductWithVariantsSchema.parse(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  },
  ["single-product"],
  { revalidate: CACHE_REVALIDATE, tags: ["products"] }
);

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
