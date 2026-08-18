import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const z = nativeRequire("zod");
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("identity and Better Auth authentication errors return 401", async () => {
  const identityResponse = await loadRouteHarness({
    identityError: new IdentityError("authentication_required"),
  }).POST(requestWith({ name: "Ada" }));
  assert.equal(identityResponse.status, 401);

  const authResponse = await loadRouteHarness({
    updateError: new APIError(401),
  }).POST(requestWith({ name: "Ada" }));
  assert.equal(authResponse.status, 401);
});

test("malformed JSON and invalid profile data return 400", async () => {
  const malformedResponse = await loadRouteHarness().POST(
    requestWith(new SyntaxError("malformed JSON")),
  );
  assert.equal(malformedResponse.status, 400);

  const validationResponse = await loadRouteHarness().POST(
    requestWith({ name: "" }),
  );
  assert.equal(validationResponse.status, 400);
});

test("unexpected auth-adapter failures return 500", async () => {
  const response = await loadRouteHarness({
    updateError: new Error("database unavailable"),
  }).POST(requestWith({ name: "Ada" }));
  assert.equal(response.status, 500);
  assert.deepEqual(response.body, { error: "Internal server error" });
});

class IdentityError extends Error {
  constructor(code) {
    super(code);
    this.name = "IdentityError";
    this.code = code;
  }
}

class APIError extends Error {
  constructor(statusCode) {
    super(String(statusCode));
    this.name = "APIError";
    this.statusCode = statusCode;
  }
}

function loadRouteHarness({ identityError, updateError } = {}) {
  const modules = {
    "next/server": {
      NextResponse: {
        json: (body, init = {}) => ({ body, status: init.status ?? 200 }),
      },
    },
    "better-auth/api": { APIError },
    zod: nativeRequire("zod"),
    "@/lib/identity": {
      IdentityError,
      updateIdentityProfileFromHeaders: async () => {
        if (identityError) throw identityError;
        if (updateError) throw updateError;
        return { id: "user-1", name: "Ada" };
      },
    },
    "@/schemas/auth": {
      UpdateProfileSchema: z.object({
        name: z.string().trim().min(1),
        email: z.string().email().optional(),
      }),
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

test("the route delegates credential handling to the identity module", () => {
  assert.doesNotMatch(source, /@\/utils\/auth|auth\.api/);
  assert.match(source, /updateIdentityProfileFromHeaders/);
});

function requestWith(payload) {
  return {
    headers: new Headers(),
    json: async () => {
      if (payload instanceof Error) throw payload;
      return payload;
    },
  };
}
