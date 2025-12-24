import type {
  DomainProduct as Product,
  DomainProductVariant as ProductVariant,
} from "@/types/domain";

export function filterProductsByCategory(
  products: Product[],
  category: string
): Product[] {
  return products.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
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
  return [...products].sort((a, b) =>
    order === "asc" ? a.price - b.price : b.price - a.price
  );
}

export function getAvailableSizes(variant: ProductVariant): string[] {
  return variant.sizes;
}

// TODO: Implement with real ratings data
export function getProductRating(_product: Product): number {
  return 4.5;
}

// TODO: Implement with real stock data
export function isProductInStock(
  _product: Product,
  _variant: ProductVariant
): boolean {
  return true;
}
