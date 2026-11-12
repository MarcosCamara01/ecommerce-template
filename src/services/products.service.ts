import "server-only";

import { dataAccess } from "@/lib/data-access";
import type { UserPrincipal } from "@/lib/identity";

export const getProductByIdForManager = (principal: UserPrincipal, id: number) =>
  dataAccess.forCatalogManager(principal).catalog.findEditableById(id);
export const getArchivedProductForRestoration = (
  principal: UserPrincipal,
  id: number,
) => dataAccess
  .forCatalogManager(principal)
  .catalog.findArchivedByIdForRestoration(id);
