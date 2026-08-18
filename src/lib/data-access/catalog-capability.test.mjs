import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./index.ts", import.meta.url), "utf8");

test("fulfillment management cannot authorize catalog management", () => {
  const { dataAccess } = loadDataAccessHarness();
  const fulfillmentOnly = {
    kind: "user",
    userId: "operator-1",
    capabilities: ["fulfillment:manage"],
  };

  assert.throws(
    () => dataAccess.forCatalogManager(fulfillmentOnly),
    /catalog:manage is required/,
  );
});

test("catalog boundary internally requests the exact catalog capability", () => {
  const { dataAccess, requestedCapabilities } = loadDataAccessHarness();
  const catalogManager = {
    kind: "user",
    userId: "catalog-admin-1",
    capabilities: ["catalog:manage"],
  };

  assert.ok(dataAccess.forCatalogManager(catalogManager).catalog);
  assert.deepEqual(requestedCapabilities, ["catalog:manage"]);
  assert.equal(dataAccess.forCatalogManager.length, 1);
});

test("catalog manager data access exposes reads but no direct product writes", () => {
  const { dataAccess } = loadDataAccessHarness();
  const managerCatalog = dataAccess.forCatalogManager({
    kind: "user",
    userId: "catalog-admin-1",
    capabilities: ["catalog:manage"],
  }).catalog;

  assert.equal(typeof managerCatalog.findByIdIncludingArchived, "function");
  assert.equal(typeof managerCatalog.findEditableById, "function");
  assert.equal(typeof managerCatalog.findArchivedByIdForRestoration, "function");
  for (const write of ["create", "createWithVariants", "update", "updateWithVariants", "delete"]) {
    assert.equal(write in managerCatalog, false, `${write} must go through catalog-sync`);
  }
});

function loadDataAccessHarness() {
  const requestedCapabilities = [];
  const assertCapability = (principal, capability) => {
    requestedCapabilities.push(capability);
    if (!principal.capabilities.includes(capability)) {
      throw new Error(`${capability} is required`);
    }
    return principal;
  };
  const emptyRepository = {};
  const modules = {
    "server-only": {},
    "@/lib/identity": {
      assertCapability,
      assertSystemPrincipal: (principal) => principal,
      assertUserPrincipal: (principal) => principal,
    },
    "@/lib/db/drizzle/schema": {},
    "@/lib/db/drizzle/repositories/cart.repository": {
      cartRepository: emptyRepository,
    },
    "@/lib/db/drizzle/repositories/checkout.repository": {
      checkoutRepository: emptyRepository,
    },
    "@/lib/db/drizzle/repositories/fulfillment.repository": {
      fulfillmentRepository: emptyRepository,
    },
    "@/lib/db/drizzle/repositories/orders.repository": {
      ordersRepository: emptyRepository,
    },
    "@/lib/db/drizzle/repositories/products.repository": {
      productsRepository: emptyRepository,
    },
    "@/lib/db/drizzle/repositories/wishlist.repository": {
      wishlistRepository: emptyRepository,
    },
    "@/lib/cart/checkout-selection": {
      selectCheckoutCartItems: () => [],
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "index.ts",
  }).outputText;
  const dataAccessModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    dataAccessModule,
    dataAccessModule.exports,
  );
  return { ...dataAccessModule.exports, requestedCapabilities };
}
