// Products business logic

import type { Product, ProductVariant } from "@/types/domain";

export function filterProductsByCategory(
  products: Product[],
  category: string
): Product[] {
  return products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

export function filterProductsByPriceRange(
  products: Product[],
  minPrice: number,
  maxPrice: number
): Product[] {
  return products.filter((p) => p.price >= minPrice && p.price <= maxPrice);
}

export function sortProductsByPrice(
  products: Product[],
  order: "asc" | "desc" = "asc"
): Product[] {
  return [...products].sort((a, b) => {
    return order === "asc" ? a.price - b.price : b.price - a.price;
  });
}

export function getAvailableSizes(variant: ProductVariant): string[] {
  return variant.sizes;
}

export function getProductRating(product: Product): number {
  // Placeholder for rating calculation
  return 4.5;
}

export function isProductInStock(product: Product, variant: ProductVariant): boolean {
  // Placeholder for stock checking
  return true;
}

