import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const userRouteSource = await readFile(
  new URL("../../../../lib/http/user-route.ts", import.meta.url),
  "utf8",
);

test("malformed cart JSON returns 400", async () => {
  const response = await loadRouteHarness().POST(
    requestWith(new SyntaxError("malformed")),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "Invalid cart payload" });
});

test("cart preserves auth, Zod, and operational error mappings", async (t) => {
  t.mock.method(console, "error", () => undefined);
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

test("adding past the cart line quantity limit returns 400", async () => {
  const response = await loadRouteHarness({
    serviceError: new DataAccessError(
      "quantity_limit_exceeded",
      "Cart line quantity would exceed its limit",
    ),
  }).POST(requestWith(validItem()));
  assert.equal(response.status, 400);
  assert.match(response.body.error, /quantity/i);
});

test("cart and wishlist routes share HTTP behavior and call data access directly", async () => {
  const wishlistSource = await readFile(
    new URL("../wishlist/route.ts", import.meta.url),
    "utf8",
  );
  for (const routeSource of [source, wishlistSource]) {
    assert.match(routeSource, /dataAccess\.forUser\(principal\)/);
    assert.match(routeSource, /readJsonBody/);
    assert.match(routeSource, /userRouteError/);
    assert.doesNotMatch(routeSource, /@\/services\/(?:cart|wishlist)\.service/);
  }
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
  const cart = {
    add: async () => {
      if (serviceError) throw serviceError;
      return { id: 1 };
    },
    clear: async () => undefined,
    list: async () => [],
    listWithDetails: async () => [],
    remove: async () => true,
    update: async () => ({ id: 1 }),
  };
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    zod: z,
    "@/lib/data-access": {
      DataAccessError,
      dataAccess: { forUser: () => ({ cart }) },
    },
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
      identityErrorHttpStatus: (error) =>
        error.code === "authentication_required" ? 401 : 403,
      requirePrincipalFromHeaders: async () => {
        if (unauthenticated) throw new IdentityError("authentication_required");
        return { kind: "user", userId: "user-1" };
      },
    },
  };
  modules["@/lib/http/user-route"] = loadModule(userRouteSource, modules);
  return loadModule(source, modules);
}

function loadModule(moduleSource, modules) {
  const compiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "module.ts",
  }).outputText;
  const loadedModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    loadedModule,
    loadedModule.exports,
  );
  return loadedModule.exports;
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
