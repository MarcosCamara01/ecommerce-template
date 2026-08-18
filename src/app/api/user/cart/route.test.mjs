import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("malformed cart JSON returns 400", async () => {
  const response = await loadRouteHarness().POST(
    requestWith(new SyntaxError("malformed")),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "Invalid cart payload" });
});

test("cart preserves auth, Zod, and operational error mappings", async () => {
  const authResponse = await loadRouteHarness({ unauthenticated: true }).POST(
    requestWith(validItem()),
  );
  assert.equal(authResponse.status, 401);

  const validationResponse = await loadRouteHarness().POST(requestWith({}));
  assert.equal(validationResponse.status, 400);

  const operationalResponse = await loadRouteHarness({
    serviceError: new SyntaxError("internal parser failure"),
  }).POST(requestWith(validItem()));
  assert.equal(operationalResponse.status, 500);
});

test("archived cart additions return 404", async () => {
  const response = await loadRouteHarness({
    serviceError: new DataAccessError("not_found", "Variant is unavailable"),
  }).POST(requestWith(validItem()));
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { error: "Not found" });
});

class IdentityError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

class DataAccessError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function loadRouteHarness({ unauthenticated = false, serviceError } = {}) {
  const z = nativeRequire("zod");
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    zod: z,
    "@/lib/data-access": { DataAccessError },
    "@/lib/db/drizzle/schema": {
      addToCartSchema: z.object({
        variantId: z.number().int().positive(),
        size: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
      cartItemWithDetailsSchema: z.object({}).passthrough(),
      selectCartItemSchema: z.object({}).passthrough(),
      updateCartItemSchema: z.object({
        id: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    },
    "@/lib/identity": {
      IdentityError,
      requirePrincipalFromHeaders: async () => {
        if (unauthenticated) throw new IdentityError("authentication_required");
        return { kind: "user", userId: "user-1" };
      },
    },
    "@/services/cart.service": {
      addToCart: async () => {
        if (serviceError) throw serviceError;
        return { id: 1 };
      },
      clearCart: async () => undefined,
      getCart: async () => [],
      getCartWithDetails: async () => [],
      removeFromCart: async () => true,
      updateCartItem: async () => ({ id: 1 }),
    },
  };
  return loadModule(modules);
}

function loadModule(modules) {
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
    json: async () => {
      if (payload instanceof Error) throw payload;
      return payload;
    },
  };
}

function validItem() {
  return { variantId: 1, size: "M", quantity: 1 };
}
