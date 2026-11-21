import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import * as emailFlows from "../../../../lib/auth/email-flows.ts";
import * as localCallback from "../../../../lib/auth/local-callback.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

const ORIGIN = "https://store.example.test";
const post = (fields) => {
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.set(name, value);
  return new Request(`${ORIGIN}/api/auth/email-form`, { method: "POST", body });
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

function loadRouteHarness(respond) {
  const calls = [];
  const modules = {
    "next/server": {
      NextResponse: {
        redirect: (url, init) =>
          new Response(null, { status: init.status, headers: { location: String(url) } }),
      },
    },
    "@/lib/app-origin": { getCanonicalAppOrigin: () => ORIGIN },
    "@/lib/auth/email-flows": emailFlows,
    "@/lib/auth/endpoint": {
      callAuthEndpoint: async (endpoint, body) => {
        calls.push({ endpoint, body });
        return respond(endpoint, body);
      },
    },
    "@/lib/auth/local-callback": localCallback,
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
  return { ...routeModule.exports, calls };
}
