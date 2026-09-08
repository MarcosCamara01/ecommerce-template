import {
  archiveCatalogProduct,
  createCatalogProduct,
  updateCatalogProduct,
} from "@/lib/catalog-sync/admin-mutations";
import {
  IdentityError,
  identityErrorHttpStatus,
  requireCapabilityFromHeaders,
} from "@/lib/identity";

import { createCatalogRouteHandler } from "./authorization";

const identityStatus = (error: unknown) =>
  error instanceof IdentityError ? identityErrorHttpStatus(error) : null;

export const POST = createCatalogRouteHandler(
  requireCapabilityFromHeaders,
  identityStatus,
  createCatalogProduct,
);
export const PUT = createCatalogRouteHandler(
  requireCapabilityFromHeaders,
  identityStatus,
  updateCatalogProduct,
);
export const DELETE = createCatalogRouteHandler(
  requireCapabilityFromHeaders,
  identityStatus,
  archiveCatalogProduct,
);
