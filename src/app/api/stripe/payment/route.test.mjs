import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";
import { planCheckoutIntent } from "../../../../lib/cart/checkout-intent-plan.ts";
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
    variant: { stripeId: `price_${index}`, color: "Black", images: ["https://example.test/item.jpg"] },
    product: { price: 10, name: "Test product", img: "https://example.test/product.jpg" },
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
        variant: { stripeId: "price_1", color: "Black", images: ["https://example.test/item.jpg"] },
        product: { price: 10, name: "Test product", img: "https://example.test/product.jpg" },
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

test("checkout intent snapshots immutable product display facts", async () => {
  let captured;
  const response = await loadRouteHarness({
    onCreateIntent: (snapshot) => {
      captured = snapshot;
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(response.status, 200);
  assert.deepEqual(captured[0], {
    cartItemId: 1,
    variantId: 2,
    size: "M",
    quantity: 1,
    priceId: "price_1",
    unitAmount: 1000,
    currency: "eur",
    productName: "Test product",
    variantColor: "Black",
    imageUrl: "https://example.test/item.jpg",
  });
});

test("Checkout return URLs use the configured canonical application origin", () => {
  assert.match(source, /getCanonicalAppOrigin/);
  assert.match(source, /success_url: `\$\{appOrigin\}\/result/);
  assert.match(source, /cancel_url: `\$\{appOrigin\}\/cart`/);
  assert.doesNotMatch(source, /request\.nextUrl\.origin/);
});

const openIntent = (overrides = {}) => ({
  id: "intent-1",
  checkoutSessionId: null,
  expiresAt: new Date("2030-01-01T00:32:00Z"),
  ...overrides,
});

test("concurrent checkouts of the same cart share one Checkout Session", async () => {
  const intents = [];
  let lock = Promise.resolve();
  const claimIntent = (items, stale) => {
    const run = lock.then(async () => {
      const open = intents.map((intent) => ({ ...intent, reusable: true }));
      const plan = planCheckoutIntent(open, items, new Set(stale));
      if (plan.reuse) return { intent: plan.reuse, supersededSessionIds: [] };
      const intent = openIntent({ id: `intent-${intents.length + 1}`, items });
      intents.unshift(intent);
      return { intent, supersededSessionIds: plan.supersededSessionIds };
    });
    lock = run;
    return run;
  };
  const sessionsByKey = new Map();
  const route = loadRouteHarness({
    claimIntent,
    stripeSessions: {
      create: async (params, options) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (!sessionsByKey.has(options.idempotencyKey)) {
          const id = `cs_${sessionsByKey.size + 1}`;
          sessionsByKey.set(options.idempotencyKey, { id, url: `https://checkout.test/${id}` });
        }
        return sessionsByKey.get(options.idempotencyKey);
      },
    },
  });
  const responses = await Promise.all(
    Array.from({ length: 15 }, () => route.POST(requestWith({ cartItemIds: [1] }))),
  );
  assert.deepEqual(new Set(responses.map((response) => response.status)), new Set([200]));
  assert.equal(new Set(responses.map((response) => response.body.url)).size, 1);
  assert.equal(sessionsByKey.size, 1);
  assert.equal(intents.length, 1);
});

test("the session is created under the intent's idempotency key and expiry", async () => {
  let call;
  const response = await loadRouteHarness({
    stripeSessions: {
      create: async (params, options) => {
        call = { params, options };
        return { id: "cs_1", url: "https://checkout.test" };
      },
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(response.status, 200);
  assert.equal(call.options.idempotencyKey, "checkout-intent:intent-1");
  assert.equal(
    call.params.expires_at,
    Date.parse("2030-01-01T00:32:00Z") / 1000,
  );
});

test("an open session for the same cart is returned instead of a new one", async () => {
  const response = await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent({ checkoutSessionId: "cs_open" }),
      supersededSessionIds: [],
    }),
    stripeSessions: {
      create: async () => assert.fail("a second payable session was created"),
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.deepEqual(response.body, { url: "https://checkout.test/cs_open" });
});

test("a cart whose session is already paid goes to its result page", async () => {
  const response = await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent({ checkoutSessionId: "cs_paid" }),
      supersededSessionIds: [],
    }),
    stripeSessions: {
      retrieve: async (id) => ({ id, status: "complete", url: null }),
      create: async () => assert.fail("a paid cart was charged again"),
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.deepEqual(response.body, {
    url: "https://shop.example.test/result?session_id=cs_paid",
  });
});

test("superseded open sessions are expired before a new one is created", async () => {
  const events = [];
  const response = await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent(),
      supersededSessionIds: ["cs_old"],
    }),
    stripeSessions: {
      expire: async (id) => {
        events.push(`expire:${id}`);
      },
      create: async () => {
        events.push("create");
        return { id: "cs_new", url: "https://checkout.test/cs_new" };
      },
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(response.status, 200);
  assert.deepEqual(events, ["expire:cs_old", "create"]);
});

test("a superseded session that was already paid stops the new charge", async () => {
  const response = await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent(),
      supersededSessionIds: ["cs_paid"],
    }),
    stripeSessions: {
      retrieve: async (id) => ({ id, status: "complete", url: null }),
      create: async () => assert.fail("overlapping lines were charged twice"),
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.deepEqual(response.body, {
    url: "https://shop.example.test/result?session_id=cs_paid",
  });
});

test("a superseded session expired by a concurrent request is not an error", async () => {
  let retrievals = 0;
  const response = await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent(),
      supersededSessionIds: ["cs_old"],
    }),
    stripeSessions: {
      retrieve: async (id) => ({
        id,
        status: (retrievals += 1) === 1 ? "open" : "expired",
        url: null,
      }),
      expire: async () => {
        throw new Error("Checkout Session is not open");
      },
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.equal(response.status, 200);
});

test("an expired session for the same cart is replaced by a fresh intent", async () => {
  const claims = [];
  const response = await loadRouteHarness({
    claimIntent: async (snapshot, stale) => {
      claims.push([...stale]);
      return claims.length === 1
        ? { intent: openIntent({ id: "intent-old", checkoutSessionId: "cs_gone" }), supersededSessionIds: [] }
        : { intent: openIntent({ id: "intent-new" }), supersededSessionIds: [] };
    },
    stripeSessions: {
      retrieve: async (id) => ({ id, status: "expired", url: null }),
      create: async (params, options) => ({
        id: "cs_fresh",
        url: `https://checkout.test/${options.idempotencyKey}`,
      }),
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.deepEqual(claims, [[], ["intent-old"]]);
  assert.deepEqual(response.body, {
    url: "https://checkout.test/checkout-intent:intent-new",
  });
});

test("only sessions Stripe confirms expired are retired", async () => {
  const retired = [];
  const statuses = { cs_open: "open", cs_gone: "expired", cs_unknown: null };
  await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent(),
      supersededSessionIds: ["cs_open", "cs_gone", "cs_unknown"],
    }),
    retireSessions: async (ids) => retired.push(...ids),
    stripeSessions: {
      retrieve: async (id) => ({ id, status: statuses[id], url: null }),
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.deepEqual(retired, ["cs_open", "cs_gone"]);
});

test("a paid superseded session is never retired", async () => {
  const retired = [];
  const response = await loadRouteHarness({
    claimIntent: async () => ({
      intent: openIntent(),
      supersededSessionIds: ["cs_gone", "cs_paid"],
    }),
    retireSessions: async (ids) => retired.push(...ids),
    stripeSessions: {
      retrieve: async (id) => ({
        id,
        status: id === "cs_paid" ? "complete" : "expired",
        url: null,
      }),
    },
  }).POST(requestWith({ cartItemIds: [1] }));
  assert.deepEqual(retired, ["cs_gone"]);
  assert.deepEqual(response.body, {
    url: "https://shop.example.test/result?session_id=cs_paid",
  });
});

test("each superseded session is read from Stripe until it is retired, not on every checkout", async () => {
  const intents = [];
  const sessions = new Map();
  let quantity = 1;
  let reads = 0;
  const route = loadRouteHarness({
    checkoutItemsResult: () => [cartItem({ quantity })],
    claimIntent: async (items, stale) => {
      const open = intents
        .filter((intent) => !intent.retired)
        .map((intent) => ({ ...intent, reusable: true }));
      const plan = planCheckoutIntent(open, items, new Set(stale));
      if (plan.reuse) {
        return { intent: plan.reuse, supersededSessionIds: plan.supersededSessionIds };
      }
      const intent = openIntent({ id: `intent-${intents.length + 1}`, items });
      intents.unshift(intent);
      return { intent, supersededSessionIds: plan.supersededSessionIds };
    },
    bindIntent: async (intentId, sessionId) => {
      intents.find((intent) => intent.id === intentId).checkoutSessionId = sessionId;
    },
    retireSessions: async (ids) => {
      for (const intent of intents) {
        if (ids.includes(intent.checkoutSessionId)) intent.retired = true;
      }
    },
    stripeSessions: {
      create: async () => {
        const id = `cs_${sessions.size + 1}`;
        sessions.set(id, "open");
        return { id, url: `https://checkout.test/${id}` };
      },
      retrieve: async (id) => {
        reads += 1;
        return { id, status: sessions.get(id), url: `https://checkout.test/${id}` };
      },
      expire: async (id) => {
        sessions.set(id, "expired");
      },
    },
  });
  for (quantity = 1; quantity <= 50; quantity += 1) {
    await route.POST(requestWith({ cartItemIds: [1] }));
  }
  assert.equal(reads, 49, "each quantity change reads only the session it replaces");
  quantity = 50;
  reads = 0;
  for (let retry = 0; retry < 10; retry += 1) {
    const response = await route.POST(requestWith({ cartItemIds: [1] }));
    assert.deepEqual(response.body, { url: "https://checkout.test/cs_50" });
  }
  assert.equal(reads, 10, "an identical retry reads only the session it reuses");
  assert.equal([...sessions.values()].filter((status) => status === "open").length, 1);
});

function cartItem(overrides = {}) {
  return {
    id: 1,
    variantId: 2,
    size: "M",
    quantity: 1,
    variant: { stripeId: "price_1", color: "Black", images: ["https://example.test/item.jpg"] },
    product: { price: 10, name: "Test product", img: "https://example.test/product.jpg" },
    ...overrides,
  };
}

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
  claimIntent,
  bindIntent = async () => ({ id: "intent-1" }),
  retireSessions = async () => undefined,
  stripeSessions = {},
  unitAmount = 1000,
} = {}) {
  const principal = { kind: "user", userId: "user-1" };
  const userAccess = {
    cart: {
      checkoutItems: async () => {
        if (checkoutItemsError) throw checkoutItemsError;
        if (typeof checkoutItemsResult === "function") return checkoutItemsResult();
        return checkoutItemsResult ?? [cartItem()];
      },
    },
    checkout: {
      claimIntent: claimIntent ?? (async (snapshot) => {
        onCreateIntent?.(snapshot);
        return {
          intent: {
            id: "intent-1",
            checkoutSessionId: null,
            expiresAt: new Date("2030-01-01T00:32:00Z"),
          },
          supersededSessionIds: [],
        };
      }),
      bindIntent,
      retireSessions,
    },
  };
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    zod: nativeRequire("zod"),
    "@/lib/app-origin": {
      getCanonicalAppOrigin: () => "https://shop.example.test",
    },
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
            retrieve: async (id) => ({ id, status: "open", url: `https://checkout.test/${id}` }),
            expire: async () => undefined,
            ...stripeSessions,
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
