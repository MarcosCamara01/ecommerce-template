"use server";

// Products API service

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { productsItems } from "@/lib/db/schema";
import {
  ProductCategoryEnum,
  ProductSchema,
  ProductWithVariantsSchema,
  type Product,
  type ProductWithVariants,
} from "@/schemas";

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
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

export async function getProductById(
  id: number
): Promise<ProductWithVariants | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const product = await db.query.productsItems.findFirst({
      where: eq(productsItems.id, id),
      with: { variants: true },
    });

    return product ? ProductWithVariantsSchema.parse(product) : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductsByCategory(
  category: string
): Promise<ProductWithVariants[]> {
  try {
    const parsedCategory = ProductCategoryEnum.parse(category);
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const products = await db.query.productsItems.findMany({
      where: eq(productsItems.category, parsedCategory),
      with: { variants: true },
    });

    return ProductWithVariantsSchema.array().parse(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const [created] = await db
      .insert(productsItems)
      .values(product)
      .returning();

    return created ? ProductSchema.parse(created) : null;
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
}
