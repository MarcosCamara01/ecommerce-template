import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";

import { dataAccess } from "@/lib/data-access";
import {
  productWithVariantsSchema,
  type ProductWithVariants,
} from "@/lib/db/drizzle/schema";

/**
 * The catalogue the search modal filters on the client, newest first.
 * Cached under "products", which catalogue mutations revalidate.
 */
export async function getSearchCatalog(): Promise<ProductWithVariants[]> {
  await connection();
  return getCachedSearchCatalog();
}

async function getCachedSearchCatalog(): Promise<ProductWithVariants[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  return productWithVariantsSchema.array().parse(await dataAccess.catalog.list());
}
