import assert from "node:assert/strict";
import test from "node:test";

import { assertSystemPrincipal } from "../identity/principal-authority.ts";
import { getCatalogSyncSystemPrincipal } from "./system-principal.ts";

test("catalog sync owns a purpose-limited System Principal factory", () => {
  const principal = getCatalogSyncSystemPrincipal();

  assert.equal(assertSystemPrincipal(principal, "catalog-sync"), principal);
  assert.throws(
    () => assertSystemPrincipal(principal, "order-fulfillment"),
    /order-fulfillment System Principal/,
  );
});
