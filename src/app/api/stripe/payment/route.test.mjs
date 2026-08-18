import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";
import { stripeEurChargeTotal } from "../../../../lib/stripe/amount-limits.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("malformed checkout JSON returns a clear 400", async () => {
  const response = await loadRouteHarness().POST(
    requestWith(new SyntaxError("malformed JSON")),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    statusCode: 400,
    message: "Invalid JSON body",
  });
});

test("Zod and unavailable cart items remain 400", async () => {
  const validationResponse = await loadRouteHarness().POST(
    requestWith({ cartItemIds: [] }),
  );
  assert.equal(validationResponse.status, 400);

  const unavailableResponse = await loadRouteHarness({
    checkoutItemsError: new DataAccessError("not_found", "missing"),
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(unavailableResponse.status, 400);
});

test("missing identity remains 401", async () => {
  const response = await loadRouteHarness({ unauthenticated: true }).POST(
    requestWith({ cartItemIds: [1] }),
  );
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { statusCode: 401, message: "Unauthorized" });
});

test("unexpected checkout failures remain 500", async () => {
  const response = await loadRouteHarness({
    checkoutItemsError: new Error("database unavailable"),
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { statusCode: 500, message: "Checkout failed" });
});

test("resolved checkout snapshots are bounded before intent persistence", async () => {
  const checkoutItemsResult = Array.from({ length: 101 }, (_, index) => ({
    id: index + 1,
    variantId: index + 1000,
    size: "M",
    quantity: 1,
    variant: { stripeId: `price_${index}` },
    product: { price: 10 },
  }));
  const response = await loadRouteHarness({
    checkoutItemsResult,
    onCreateIntent: () => assert.fail("oversized snapshot was persisted"),
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(response.status, 400);
});

test("Stripe aggregate charge limits are enforced before intent persistence", async () => {
  for (const [unitAmount, quantity] of [[49, 1], [50_000_000, 2]]) {
    const response = await loadRouteHarness({
      unitAmount,
      checkoutItemsResult: [{
        id: 1,
        variantId: 2,
        size: "M",
        quantity,
        variant: { stripeId: "price_1" },
        product: { price: 10 },
      }],
      onCreateIntent: () => assert.fail("invalid aggregate was persisted"),
    }).POST(requestWith({ cartItemIds: [1] }));
    assert.equal(response.status, 400);
  }
});

test("Checkout Sessions carry the stable integration identifier", () => {
  assert.match(
    source,
    /STRIPE_INTEGRATION_IDENTIFIER = "ecommerce_template_[a-z]{8}"/,
  );
  assert.match(
    source,
    /integration_identifier: STRIPE_INTEGRATION_IDENTIFIER/,
  );
});

class IdentityError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "IdentityError";
    this.code = code;
  }
}

class DataAccessError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DataAccessError";
    this.code = code;
  }
}

function loadRouteHarness({
  unauthenticated = false,
  checkoutItemsError,
  checkoutItemsResult,
  onCreateIntent,
  unitAmount = 1000,
} = {}) {
  const principal = { kind: "user", userId: "user-1" };
  const userAccess = {
    cart: {
      checkoutItems: async () => {
        if (checkoutItemsError) throw checkoutItemsError;
        return checkoutItemsResult ?? [{
          id: 1,
          variantId: 2,
          size: "M",
          quantity: 1,
          variant: { stripeId: "price_1" },
          product: { price: 10 },
        }];
      },
    },
    checkout: {
      createIntent: async (snapshot) => {
        onCreateIntent?.(snapshot);
        return { id: "intent-1" };
      },
      bindIntent: async () => ({ id: "intent-1" }),
    },
  };
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    zod: nativeRequire("zod"),
    "@/lib/data-access": {
      DataAccessError,
      dataAccess: { forUser: () => userAccess },
    },
    "@/lib/catalog-sync/money": {
      catalogPriceCentsFromStoredDecimal: () => unitAmount,
    },
    "@/lib/identity": {
      IdentityError,
      getIdentityFromHeaders: async () => unauthenticated
        ? null
        : { principal, email: "user@example.test" },
    },
    "@/lib/order-fulfillment/checkout-snapshot": {
      createCheckoutMetadata: (id) => ({ checkoutIntentId: id }),
    },
    "@/lib/stripe": {
      stripe: {
        checkout: {
          sessions: {
            create: async () => ({ id: "cs_1", url: "https://checkout.test" }),
            expire: async () => undefined,
          },
        },
      },
    },
    "@/lib/stripe/line-items": { buildLineItems: () => [] },
    "@/lib/stripe/logger": {
      stripeLogger: { error: () => undefined },
    },
    "@/lib/stripe/amount-limits": { stripeEurChargeTotal },
    "@/services/stripe.service": {
      getOrCreateStripeCustomer: async () => "cus_1",
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "route.ts",
  }).outputText;
  const routeModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    routeModule,
    routeModule.exports,
  );
  return routeModule.exports;
}

function requestWith(payload) {
  return {
    headers: new Headers(),
    nextUrl: new URL("https://shop.example.test/api/stripe/payment"),
    json: async () => {
      if (payload instanceof Error) throw payload;
      return payload;
    },
  };
}
