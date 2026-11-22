import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import ts from "typescript";

import * as emailFlows from "../../../../lib/auth/email-flows.ts";
import * as formErrors from "../../../../lib/auth/form-errors.ts";
import * as localCallback from "../../../../lib/auth/local-callback.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");
const endpointSource = await readFile(
  new URL("../../../../lib/auth/endpoint.ts", import.meta.url),
  "utf8",
);

const ORIGIN = "https://store.example.test";
const post = (fields, headers = {}) => {
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.set(name, value);
  return new Request(`${ORIGIN}/api/auth/email-form`, { method: "POST", body, headers });
};

test("a successful sign-in follows callbackURL with every session cookie", async () => {
  const cookies = [
    "better-auth.session_token=abc; Path=/; HttpOnly",
    "better-auth.session_data=def; Path=/; HttpOnly",
  ];
  const harness = loadRouteHarness(() => ({ ok: true, cookies }));

  const response = await harness.POST(post({
    email: "alex@example.test",
    password: "correct horse",
    callbackURL: "/cart",
  }));

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${ORIGIN}/cart`);
  assert.deepEqual(response.headers.getSetCookie(), cookies);
  assert.deepEqual(harness.calls, [{
    endpoint: "/sign-in/email",
    body: { email: "alex@example.test", password: "correct horse", callbackURL: "/cart" },
  }]);
});

test("an unverified sign-in returns to /login with EMAIL_NOT_VERIFIED and keeps the destination", async () => {
  const harness = loadRouteHarness(() => ({ ok: false, code: "EMAIL_NOT_VERIFIED" }));

  const response = await harness.POST(post({
    email: "alex@example.test",
    password: "correct horse",
    callbackURL: "/cart",
  }));

  assert.equal(response.status, 303);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("error"), "EMAIL_NOT_VERIFIED");
  assert.equal(location.searchParams.get("redirect"), "/cart");
  assert.deepEqual(response.headers.getSetCookie(), []);
});

test("a foreign callbackURL falls back to /", async () => {
  const harness = loadRouteHarness(() => ({ ok: true, cookies: [] }));

  const response = await harness.POST(post({
    email: "alex@example.test",
    password: "correct horse",
    callbackURL: "https://evil.example/steal",
  }));

  assert.equal(response.headers.get("location"), `${ORIGIN}/`);
  assert.equal(harness.calls[0].body.callbackURL, "/");
});

test("a sign-up post cannot create an account through the sign-in fallback", async () => {
  const harness = loadRouteHarness(() => ({ ok: false, code: "INVALID_EMAIL_OR_PASSWORD" }));

  await harness.POST(post({
    mode: "sign-up",
    name: "Alex",
    email: "alex@example.test",
    password: "correct horse",
  }));

  assert.deepEqual(harness.calls.map(({ endpoint }) => endpoint), ["/sign-in/email"]);
  assert.equal("name" in harness.calls[0].body, false);
});

test("a sign-in posted from another site returns to the form with its refusal and no session cookie", async () => {
  const route = await loadRouteWithBetterAuth();
  const refusals = [
    [{ origin: "https://evil.example" }, "INVALID_ORIGIN"],
    [{
      origin: "https://evil.example",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    }, "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED"],
    [{ origin: "null" }, "MISSING_OR_NULL_ORIGIN"],
  ];

  for (const [headers, code] of refusals) {
    const response = await route.POST(post({
      email: "alex@example.test",
      password: "correct horse battery",
      callbackURL: "/cart",
    }, headers));

    assert.equal(response.status, 303, code);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.origin, ORIGIN, code);
    assert.equal(location.pathname, "/login", code);
    assert.equal(location.searchParams.get("error"), code);
    assert.equal(location.searchParams.get("redirect"), "/cart", code);
    assert.deepEqual(response.headers.getSetCookie(), [], code);
  }
});

test("the same sign-in from the store's own login page signs in", async () => {
  const route = await loadRouteWithBetterAuth();

  const response = await route.POST(post({
    email: "alex@example.test",
    password: "correct horse battery",
    callbackURL: "/cart",
  }, {
    origin: ORIGIN,
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "navigate",
    "sec-fetch-dest": "document",
  }));

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${ORIGIN}/cart`);
  assert.ok(
    response.headers.getSetCookie().some((cookie) => /^(__Secure-)?better-auth\.session_token=/.test(cookie)),
  );
});

function loadRouteHarness(respond) {
  const calls = [];
  const exports = loadModule(source, "route.ts", {
    ...routeModules(),
    "@/lib/auth/endpoint": {
      callAuthEndpoint: async (endpoint, body) => {
        calls.push({ endpoint, body });
        return respond(endpoint, body);
      },
    },
  });
  return { ...exports, calls };
}

async function loadRouteWithBetterAuth() {
  const auth = betterAuth({
    baseURL: ORIGIN,
    trustedOrigins: [ORIGIN],
    secret: "email-form-test-secret-email-form-0123",
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
  });
  await auth.api.signUpEmail({
    body: { name: "Alex", email: "alex@example.test", password: "correct horse battery" },
  });

  let visitor;
  const endpoint = loadModule(endpointSource, "endpoint.ts", {
    "server-only": {},
    "next/headers": { headers: async () => visitor.headers },
    "@/lib/app-origin": { getCanonicalAppOrigin: () => ORIGIN },
    "@/utils/auth": { auth },
    "./form-errors": formErrors,
  });
  const route = loadModule(source, "route.ts", {
    ...routeModules(),
    "@/lib/auth/endpoint": endpoint,
  });
  return {
    POST: (request) => {
      visitor = request;
      return route.POST(request);
    },
  };
}

function routeModules() {
  return {
    "next/server": {
      NextResponse: {
        redirect: (url, init) =>
          new Response(null, { status: init.status, headers: { location: String(url) } }),
      },
    },
    "@/lib/app-origin": { getCanonicalAppOrigin: () => ORIGIN },
    "@/lib/auth/email-flows": emailFlows,
    "@/lib/auth/local-callback": localCallback,
  };
}

function loadModule(moduleSource, fileName, modules) {
  const compiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName,
  }).outputText;
  const loaded = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(mockedRequire, loaded, loaded.exports);
  return loaded.exports;
}
