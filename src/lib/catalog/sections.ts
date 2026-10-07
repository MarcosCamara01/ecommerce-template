import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";

import { shopSections, type ShopSection } from "@/constants/navigation";
import { dataAccess } from "@/lib/data-access";

export type ShopSectionSummary = ShopSection & {
  count: number;
  /** Newest product photo in the section, for the menu thumbnails. */
  image: string | null;
};

/**
 * Counts and a thumbnail per store section. Cached under the "products" tag,
 * which catalogue mutations already revalidate.
 */
export async function getShopSectionSummaries(): Promise<ShopSectionSummary[]> {
  await connection();
  return getCachedShopSectionSummaries();
}

async function getCachedShopSectionSummaries(): Promise<ShopSectionSummary[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  // Newest first, so the first match is the freshest photo.
  const products = await dataAccess.catalog.list();
  return shopSections.map((section) => {
    const items =
      section.key === "new-in"
        ? products
        : products.filter((product) => product.category === section.key);
    return { ...section, count: items.length, image: items[0]?.img ?? null };
  });
}
