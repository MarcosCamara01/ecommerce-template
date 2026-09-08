import { createSystemPrincipalForCatalogSync } from "../identity/principal-authority.ts";

export function getCatalogSyncSystemPrincipal() {
  return createSystemPrincipalForCatalogSync();
}
