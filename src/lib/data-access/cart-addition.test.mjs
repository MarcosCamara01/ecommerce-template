import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./index.ts", import.meta.url), "utf8");

const shopper = { kind: "user", userId: "user-1", capabilities: [] };
const item = { variantId: 1, size: "M", quantity: 1 };

test("a cart addition past the line limit is a quantity limit error", async () => {
  const { dataAccess, DataAccessError } = loadDataAccess({
    status: "quantity_limit_exceeded",
  });
  await assert.rejects(dataAccess.forUser(shopper).cart.add(item), (error) => {
    assert.ok(error instanceof DataAccessError);
    assert.equal(error.code, "quantity_limit_exceeded");
    return true;
  });
});

test("an unavailable cart addition stays not found", async () => {
  const { dataAccess } = loadDataAccess({ status: "unavailable" });
  await assert.rejects(dataAccess.forUser(shopper).cart.add(item), {
    code: "not_found",
  });
});

test("an accepted cart addition returns the stored line", async () => {
  const stored = { id: 7, quantity: 3 };
  const { dataAccess, additions } = loadDataAccess({
    status: "added",
    item: stored,
  });
  assert.equal(await dataAccess.forUser(shopper).cart.add(item), stored);
  assert.deepEqual(additions, [{ ...item, userId: "user-1" }]);
});

function loadDataAccess(outcome) {
  const additions = [];
  const modules = {
    "server-only": {},
    "@/lib/identity": {
      assertCapability: (principal) => principal,
      assertSystemPrincipal: (principal) => principal,
      assertUserPrincipal: (principal) => principal,
    },
    "@/lib/db/drizzle/schema": {},
    "@/lib/db/drizzle/repositories/cart.repository": {
      cartRepository: {
        upsertAvailable: async (input) => {
          additions.push(input);
          return outcome;
        },
      },
    },
    "@/lib/db/drizzle/repositories/checkout.repository": { checkoutRepository: {} },
    "@/lib/db/drizzle/repositories/fulfillment.repository": {
      fulfillmentRepository: {},
    },
    "@/lib/db/drizzle/repositories/orders.repository": { ordersRepository: {} },
    "@/lib/db/drizzle/repositories/products.repository": { productsRepository: {} },
    "@/lib/db/drizzle/repositories/wishlist.repository": { wishlistRepository: {} },
    "@/lib/cart/checkout-selection": { selectCheckoutCartItems: () => [] },
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
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? nativeRequire(id),
    dataAccessModule,
    dataAccessModule.exports,
  );
  return { ...dataAccessModule.exports, additions };
}
