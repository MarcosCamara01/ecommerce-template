import Fuse from "fuse.js";
import type { ProductWithVariants } from "@/schemas";

/**
 * Search products and variants using fuse.js
 * @param products - The products to search
 * @param query - The query to search
 * @returns The products that match the search
 */
export function searchProducts(
  products: ProductWithVariants[],
  query?: string
): ProductWithVariants[] {
  if (!query || query.trim() === "") {
    return products;
  }

  const fuse = new Fuse(products, {
    keys: ["name", "description", "category", "variants.color"],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 1,
  });

  const results = fuse.search(query);

  return results.map((result) => result.item);
}
