import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./stripe.service.ts", import.meta.url), "utf8");

test("Stripe service exposes no catalog mutation boundary", () => {
  const service = loadServiceHarness(createFakeStripe());
  const legacyCatalogExports = [
    "createStripeProductForVariant",
    "updateStripeProductWithClient",
    "updateStripeProduct",
    "archiveStripeProductWithClient",
    "archiveStripeProduct",
    "deactivateStripePrice",
  ];

  for (const exportName of legacyCatalogExports) {
    assert.equal(exportName in service, false, `${exportName} must not be exported`);
  }
  assert.doesNotMatch(
    source,
    /\.(?:products|prices)\.(?:create|update|del)\s*\(/,
    "Stripe catalog writes must go through catalog-sync",
  );
  assert.doesNotMatch(
    source,
    /Math\.round\s*\(/,
    "Stripe service must not derive money from floating-point prices",
  );
});

test("same-user Stripe customer is reused even after foreign email matches", async () => {
  const fakeStripe = createFakeStripe();
  fakeStripe.seedCustomer("cus_foreign", "owner@example.test", {
    userId: "user-2",
  });
  fakeStripe.seedCustomer("cus_owned", "owner@example.test", {
    userId: "user-1",
  });
  const service = loadServiceHarness(fakeStripe);

  const customerId = await service.getOrCreateStripeCustomerWithClient(
    fakeStripe,
    { kind: "user", userId: "user-1", capabilities: [] },
    "owner@example.test",
  );

  assert.equal(customerId, "cus_owned");
  assert.equal(fakeStripe.createdCustomers.length, 0);
});

test("foreign or unowned email matches create a customer bound to the Principal", async () => {
  const fakeStripe = createFakeStripe();
  fakeStripe.seedCustomer("cus_foreign", "shared@example.test", {
    userId: "user-2",
  });
  fakeStripe.seedCustomer("cus_legacy", "shared@example.test", {});
  const service = loadServiceHarness(fakeStripe);

  const customerId = await service.getOrCreateStripeCustomerWithClient(
    fakeStripe,
    { kind: "user", userId: "user-1", capabilities: [] },
    "shared@example.test",
  );

  assert.notEqual(customerId, "cus_foreign");
  assert.notEqual(customerId, "cus_legacy");
  assert.deepEqual(fakeStripe.createdCustomers[0].metadata, {
    userId: "user-1",
    source: "ecommerce-template",
  });
});

test("concurrent customer creation is idempotent per Principal", async () => {
  const fakeStripe = createFakeStripe();
  const service = loadServiceHarness(fakeStripe);
  const principal = { kind: "user", userId: "user-race", capabilities: [] };
  const [first, second] = await Promise.all([
    service.getOrCreateStripeCustomerWithClient(
      fakeStripe,
      principal,
      "race@example.test",
    ),
    service.getOrCreateStripeCustomerWithClient(
      fakeStripe,
      principal,
      "race@example.test",
    ),
  ]);
  assert.equal(first, second);
  assert.equal(fakeStripe.createdCustomers.length, 1);
  assert.match(fakeStripe.creationOptions[0].idempotencyKey, /^customer:[a-f0-9]{64}$/);
});

test("customer ownership survives an account email change", async () => {
  const fakeStripe = createFakeStripe();
  fakeStripe.seedCustomer("cus_owned_old_email", "old@example.test", {
    userId: "user-email-change",
  });
  const service = loadServiceHarness(fakeStripe);
  const customerId = await service.getOrCreateStripeCustomerWithClient(
    fakeStripe,
    { kind: "user", userId: "user-email-change", capabilities: [] },
    "new@example.test",
  );
  assert.equal(customerId, "cus_owned_old_email");
  assert.equal(fakeStripe.createdCustomers.length, 0);
});

test("paid checkout exposes durable fulfillment state instead of immediate success", async () => {
  const session = {
    id: "cs_paid",
    status: "complete",
    payment_status: "paid",
    customer_details: { email: "buyer@example.test" },
  };
  const cases = [
    [
      { status: "fulfillment_pending" },
      { status: "fulfillment_pending", session, outcome: { status: "fulfillment_pending" } },
    ],
    [
      { status: "needs_attention" },
      { status: "needs_attention", session, outcome: { status: "needs_attention" } },
    ],
    [
      {
        status: "fulfilled",
        orderId: 42,
        customerEmail: "queued",
        cartCleanup: "succeeded",
      },
      {
        status: "success",
        session,
        outcome: {
          status: "fulfilled",
          orderId: 42,
          customerEmail: "queued",
          cartCleanup: "succeeded",
        },
      },
    ],
  ];

  for (const [outcome, expected] of cases) {
    const service = loadServiceHarness(createFakeStripe(), { session, outcome });
    assert.deepEqual(await service.fetchCheckoutData("cs_paid"), expected);
  }
});

function loadServiceHarness(fakeStripe, { session = null, outcome } = {}) {
  class StripeError extends Error {}
  const modules = {
    "server-only": {},
    "@/lib/identity": {
      getPrincipal: async () =>
        session ? { kind: "user", userId: "user-1", capabilities: [] } : null,
    },
    "@/lib/order-fulfillment": {
      requestFulfillment: async () => outcome,
    },
    "@/lib/order-fulfillment/owned-checkout-session": {
      retrieveOwnedCheckoutSession: async () => session,
    },
    "@/lib/stripe": {
      stripe: fakeStripe,
      Stripe: { errors: { StripeError } },
    },
    "@/lib/stripe/logger": {
      stripeLogger: { info: () => undefined, error: () => undefined },
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "stripe.service.ts",
  }).outputText;
  const serviceModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    serviceModule,
    serviceModule.exports,
  );
  return serviceModule.exports;
}

function createFakeStripe() {
  const customers = [];
  const createdCustomers = [];
  const creationOptions = [];
  const idempotentCustomers = new Map();
  let customerSequence = 0;

  return {
    createdCustomers,
    creationOptions,
    seedCustomer(id, email, metadata) {
      customers.push({ id, email, metadata });
    },
    customers: {
      search: async ({ query, limit }) => {
        const userId = /metadata\['userId'\]:'((?:\\.|[^'])*)'/.exec(query)?.[1]
          ?.replaceAll("\\'", "'")
          .replaceAll("\\\\", "\\");
        return {
          data: customers
            .filter((customer) => customer.metadata?.userId === userId)
            .slice(0, limit),
        };
      },
      list: async ({ email, limit }) => ({
        data: customers.filter((customer) => customer.email === email).slice(0, limit),
      }),
      create: async (input, options = {}) => {
        if (options.idempotencyKey && idempotentCustomers.has(options.idempotencyKey)) {
          const previous = idempotentCustomers.get(options.idempotencyKey);
          if (JSON.stringify(previous.input) !== JSON.stringify(input)) {
            throw new Error("idempotency key reused with different parameters");
          }
          return previous.customer;
        }
        const customer = { id: `cus_created_${++customerSequence}`, ...input };
        customers.push(customer);
        createdCustomers.push(customer);
        creationOptions.push(options);
        if (options.idempotencyKey) {
          idempotentCustomers.set(options.idempotencyKey, { customer, input });
        }
        return customer;
      },
    },
  };
}
