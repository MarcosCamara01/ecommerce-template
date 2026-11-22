import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";

import { helpLinks } from "@/constants/navigation";
import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { dataAccess } from "@/lib/data-access";
import { ProductCategoryZod } from "@/lib/db/drizzle/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  return getCachedSitemap();
}

async function getCachedSitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const origin = getCanonicalAppOrigin();
  const pages = [
    "/",
    "/new-in",
    ...ProductCategoryZod.options.map((category) => `/${category}`),
    ...helpLinks.map((link) => link.href),
  ];
  const products = await dataAccess.catalog.list();
  return [
    ...pages.map((path) => ({ url: new URL(path, origin).href })),
    ...products.map((product) => ({
      url: new URL(`/${product.category}/${product.id}`, origin).href,
      lastModified: product.updatedAt,
    })),
  ];
}
