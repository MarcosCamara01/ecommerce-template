"use server";

import { dataAccess } from "@/lib/data-access";
import {
  type ProductCategory,
  productWithVariantsSchema,
  type ProductWithVariants,
} from "@/lib/db/drizzle/schema";

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  const products = productWithVariantsSchema.array().parse(await dataAccess.catalog.list());
  return products.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getCategoryProducts(
  category: ProductCategory,
): Promise<ProductWithVariants[]> {
  const products = productWithVariantsSchema
    .array()
    .parse(await dataAccess.catalog.findByCategory(category));
  return products.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getProduct(
  productId: number,
): Promise<ProductWithVariants | null> {
  const product = await dataAccess.catalog.findById(productId);
  return product ? productWithVariantsSchema.parse(product) : null;
}

export async function getRandomProducts(
  productIdToExclude: number,
): Promise<ProductWithVariants[]> {
  const products = (await getAllProducts()).filter(
    (product) => product.id !== productIdToExclude,
  );
  return products.sort(() => Math.random() - 0.5).slice(0, 6);
}
