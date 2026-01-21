"use server";

import { cacheLife, cacheTag, updateTag } from "next/cache";
import { productsRepository } from "@/lib/db/drizzle/repositories";
import {
  type ProductCategory,
  ProductWithVariantsSchema,
  type ProductWithVariants,
} from "@/schemas";

/**
 * Fetch all products with caching
 * Cache is tagged for invalidation and set to revalidate every hour
 */
export async function getAllProducts(): Promise<ProductWithVariants[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  try {
    const products = await productsRepository.findAll();
    const validatedProducts = ProductWithVariantsSchema.array().parse(products);
    return validatedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

/**
 * Fetch products by category with caching
 * Each category has its own cache entry (category arg becomes part of cache key)
 */
export async function getCategoryProducts(
  category: ProductCategory
): Promise<ProductWithVariants[]> {
  "use cache";
  cacheTag("products", `category-${category}`);
  cacheLife("hours");

  try {
    const products = await productsRepository.findByCategory(category);
    const validatedProducts = ProductWithVariantsSchema.array().parse(products);
    return validatedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching category products:", error);
    return [];
  }
}

/**
 * Fetch a single product by ID with caching
 * Each product has its own cache entry (productId arg becomes part of cache key)
 */
export async function getProduct(
  productId: number
): Promise<ProductWithVariants | null> {
  "use cache";
  cacheTag("products", `product-${productId}`);
  cacheLife("hours");

  try {
    const product = await productsRepository.findById(productId);
    if (!product) return null;
    return ProductWithVariantsSchema.parse(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

/**
 * Fetch random products excluding a specific product
 * Note: This is dynamic (random) so it stays outside cache
 * It benefits from the cached getAllProducts() call
 */
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
 * Invalidates all product caches immediately
 * Call this after creating, updating, or deleting products
 * Uses updateTag for read-your-own-writes semantics (user sees changes immediately)
 */
export async function revalidateProducts(productId?: number): Promise<void> {
  // Always invalidate the general products tag
  updateTag("products");

  // If a specific product ID is provided, also invalidate that specific product
  if (productId) {
    updateTag(`product-${productId}`);
  }
}
