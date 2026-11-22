import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

const ORIGIN = "https://store.example.test";
const route = loadRoute();

const request = (method, path, headers = {}, body) =>
  new Request(`${ORIGIN}/api/auth${path}`, {
    method,
    headers: body ? { "content-type": "application/json", ...headers } : headers,
    body: body && JSON.stringify(body),
  });

test("the store's own origin can read auth responses with its credentials", async () => {
  const response = await route.GET(request("GET", "/get-session", { origin: ORIGIN }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("vary"), /\bOrigin\b/);
});

test("a trusted sign-up keeps its session cookie beside the CORS headers", async () => {
  const response = await route.POST(request("POST", "/sign-up/email", { origin: ORIGIN }, {
    name: "Alex",
    email: "alex@example.test",
    password: "correct horse battery",
  }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.ok(
    response.headers.getSetCookie().some((cookie) => /^(__Secure-)?better-auth\.session_token=/.test(cookie)),
    response.headers.getSetCookie().map((cookie) => cookie.split("=", 1)[0]).join(", "),
  );
  assert.equal((await response.json()).user.email, "alex@example.test");
});

test("an untrusted or missing origin gets no CORS headers", async () => {
  for (const origin of [
    "https://evil.example",
    "https://store.example.test.evil.example",
    "http://store.example.test",
    "HTTPS://STORE.EXAMPLE.TEST",
    "null",
    undefined,
  ]) {
    const response = await route.GET(
      request("GET", "/get-session", origin === undefined ? {} : { origin }),
    );
    assert.equal(response.status, 200, String(origin));
    assert.equal(response.headers.get("access-control-allow-origin"), null, String(origin));
    assert.equal(response.headers.get("access-control-allow-credentials"), null, String(origin));
  }
});

test("a sign-in from another origin is still refused, with no CORS headers", async () => {
  const response = await route.POST(request("POST", "/sign-in/email", { origin: "https://evil.example" }, {
    email: "alex@example.test",
    password: "correct horse battery",
  }));

  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "INVALID_ORIGIN");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(response.headers.getSetCookie(), []);
});

test("a preflight from the store's own origin allows GET and POST with a JSON body", () => {
  const response = route.OPTIONS(request("OPTIONS", "/sign-in/email", {
    origin: ORIGIN,
    "access-control-request-method": "POST",
    "access-control-request-headers": "content-type",
  }));

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.deepEqual(
    response.headers.get("access-control-allow-methods").split(/,\s*/).sort(),
    ["GET", "POST"],
  );
  assert.equal(response.headers.get("access-control-allow-headers"), "content-type");
  assert.match(response.headers.get("vary"), /\bOrigin\b/);
});

test("a preflight from another origin allows nothing", () => {
  const response = route.OPTIONS(request("OPTIONS", "/sign-in/email", {
    origin: "https://evil.example",
    "access-control-request-method": "POST",
    "access-control-request-headers": "content-type",
  }));

  assert.equal(response.status, 204);
  assert.deepEqual(
    [...response.headers.keys()].filter((name) => name.startsWith("access-control-")),
    [],
  );
});

function loadRoute() {
  const auth = betterAuth({
    baseURL: ORIGIN,
    trustedOrigins: [ORIGIN],
    secret: "route-test-secret-route-test-secret-0123",
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
  });
  const modules = {
    "@/utils/auth": { auth, authTrustedOrigins: [ORIGIN] },
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
