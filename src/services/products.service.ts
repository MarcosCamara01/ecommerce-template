import "server-only";

import { dataAccess } from "@/lib/data-access";
import type { UserPrincipal } from "@/lib/identity";
import type { ProductCategory } from "@/lib/db/drizzle/schema";

export const getAllProducts = () => dataAccess.catalog.list();
export const getProductById = (id: number) => dataAccess.catalog.findById(id);
export const getProductsByCategory = (category: string) =>
  dataAccess.catalog.findByCategory(category as ProductCategory);
export const searchProductsInDB = (query: string) => dataAccess.catalog.search(query);
export const getRandomProducts = (limit = 4) => dataAccess.catalog.random(limit);
export const getProductByIdForManager = (principal: UserPrincipal, id: number) =>
  dataAccess.forCatalogManager(principal).catalog.findEditableById(id);
export const getArchivedProductForRestoration = (
  principal: UserPrincipal,
  id: number,
) => dataAccess
  .forCatalogManager(principal)
  .catalog.findArchivedByIdForRestoration(id);
