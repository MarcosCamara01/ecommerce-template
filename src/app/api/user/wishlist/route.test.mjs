import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("malformed wishlist JSON returns 400", async () => {
  const response = await loadRouteHarness().POST(
    requestWith(new SyntaxError("malformed")),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "Invalid wishlist payload" });
});

test("wishlist preserves auth, Zod, and operational error mappings", async () => {
  const authResponse = await loadRouteHarness({ unauthenticated: true }).POST(
    requestWith({ productId: 1 }),
  );
  assert.equal(authResponse.status, 401);

  const validationResponse = await loadRouteHarness().POST(requestWith({}));
  assert.equal(validationResponse.status, 400);

  const operationalResponse = await loadRouteHarness({
    serviceError: new SyntaxError("internal parser failure"),
  }).POST(requestWith({ productId: 1 }));
  assert.equal(operationalResponse.status, 500);
});

test("archived wishlist additions return 404", async () => {
  const response = await loadRouteHarness({
    serviceError: new DataAccessError("not_found", "Product is unavailable"),
  }).POST(requestWith({ productId: 1 }));
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
      addToWishlistSchema: z.object({ productId: z.number().int().positive() }),
      selectWishlistItemSchema: z.object({}).passthrough(),
      wishlistItemWithProductSchema: z.object({}).passthrough(),
    },
    "@/lib/identity": {
      IdentityError,
      requirePrincipalFromHeaders: async () => {
        if (unauthenticated) throw new IdentityError("authentication_required");
        return { kind: "user", userId: "user-1" };
      },
    },
    "@/services/wishlist.service": {
      addToWishlist: async () => {
        if (serviceError) throw serviceError;
        return { id: 1 };
      },
      getWishlist: async () => [],
      getWishlistWithDetails: async () => [],
      removeFromWishlist: async () => true,
      removeFromWishlistByProduct: async () => true,
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
