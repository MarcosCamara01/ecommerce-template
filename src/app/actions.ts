"use server";

import { cacheLife } from "next/cache";
import { getDb } from "@/lib/db";
import { productsItems } from "@/lib/db/schema";
import {
  ProductCategoryEnum,
  ProductWithVariantsSchema,
  type ProductWithVariants,
} from "@/schemas";
import { eq, ne } from "drizzle-orm";

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  "use cache";
  cacheLife("hours");

  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not configured, returning empty products list");
      return [];
    }
    const products = await db.query.productsItems.findMany({
      with: { variants: true },
    });

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
    const parsedCategory = ProductCategoryEnum.parse(category);
    const db = await getDb();
    if (!db) {
      console.error("Database not configured, returning empty category products");
      return [];
    }
    const products = await db.query.productsItems.findMany({
      where: eq(productsItems.category, parsedCategory),
      with: { variants: true },
    });

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
    const db = await getDb();
    if (!db) {
      console.error("Database not configured, returning null product");
      return null;
    }
    const product = await db.query.productsItems.findFirst({
      where: eq(productsItems.id, productId),
      with: { variants: true },
    });

    if (!product) {
      return null;
    }

    return ProductWithVariantsSchema.parse(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getRandomProducts(
  productIdToExclude: number
): Promise<ProductWithVariants[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not configured, returning empty random products");
      return [];
    }
    const products = await db.query.productsItems.findMany({
      where: ne(productsItems.id, productIdToExclude),
      with: { variants: true },
      limit: 30,
    });

    if (!products.length) {
      return [];
    }

    const shuffled = products.sort(() => Math.random() - 0.5);
    return ProductWithVariantsSchema.array().parse(shuffled.slice(0, 6));
  } catch (error) {
    console.error("Error fetching random products:", error);
    return [];
  }
}
