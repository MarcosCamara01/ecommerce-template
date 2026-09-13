import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("authentication failures remain 401", async () => {
  const harness = loadRouteHarness({
    identityError: new IdentityError("authentication_required"),
  });
  const response = await harness.GET(requestFor("cs_owned"));
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { message: "Unauthorized" });
});

test("Stripe resource-missing failures remain 404", async () => {
  const stripeError = new StripeError("StripeInvalidRequestError", "resource_missing");
  const harness = loadRouteHarness({ retrievalError: stripeError });
  const response = await harness.GET(requestFor("cs_missing"));
  assert.equal(response.status, 404);
});

test("invalid session identifiers remain 400", async () => {
  const harness = loadRouteHarness();
  const response = await harness.GET(requestFor("invalid"));
  assert.equal(response.status, 400);
});

test("unexpected operational failures never masquerade as authentication failures", async () => {
  const harness = loadRouteHarness({ retrievalError: new Error("database unavailable") });
  const response = await harness.GET(requestFor("cs_operational"));
  assert.equal(response.status, 500);
  assert.deepEqual(response.body, {
    message: "Unable to retrieve checkout session",
  });
});

class IdentityError extends Error {
  constructor(code) {
    super(code);
    this.name = "IdentityError";
    this.code = code;
  }
}

class StripeError extends Error {
  constructor(type, code) {
    super(type);
    this.type = type;
    this.code = code;
  }
}

function loadRouteHarness({ identityError, retrievalError } = {}) {
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    stripe: { errors: { StripeError } },
    zod: nativeRequire("zod"),
    "@/lib/identity": {
      IdentityError,
      requirePrincipalFromHeaders: async () => {
        if (identityError) throw identityError;
        return { kind: "user", userId: "user-1" };
      },
    },
    "@/lib/order-fulfillment/owned-checkout-session": {
      retrieveOwnedCheckoutSession: async () => {
        if (retrievalError) throw retrievalError;
        return { id: "cs_owned" };
      },
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

function requestFor(sessionId) {
  return {
    headers: new Headers(),
    nextUrl: new URL(`https://shop.example.test/api/stripe/checkout_sessions?session_id=${sessionId}`),
  };
}
