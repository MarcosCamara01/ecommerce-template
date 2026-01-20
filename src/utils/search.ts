import Fuse from "fuse.js";
import type { ProductWithVariants } from "@/schemas";

/** Fuzzy search products by name, description, category, and variant color */
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

  return fuse.search(query).map((result) => result.item);
}
