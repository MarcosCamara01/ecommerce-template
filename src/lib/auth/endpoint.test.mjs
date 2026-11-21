import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import * as formErrors from "./form-errors.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./endpoint.ts", import.meta.url), "utf8");

const visitorHeaders = () => new Headers({
  "content-type": "multipart/form-data; boundary=x",
  "content-length": "512",
  cookie: "theme=dark",
  origin: "https://store.example.test",
  "x-forwarded-for": "203.0.113.7",
});

test("an endpoint runs in-process at the canonical auth URL with the visitor's headers and a JSON body", async () => {
  const harness = loadEndpointHarness(() => Response.json({ status: true }));

  await harness.callAuthEndpoint("/sign-up/email", {
    name: "Alex",
    email: "alex@example.test",
    password: "correct horse",
    callbackURL: "/cart",
  });

  assert.equal(harness.requests.length, 1);
  const [request] = harness.requests;
  assert.equal(request.url, "https://store.example.test/api/auth/sign-up/email");
  assert.equal(request.method, "POST");
  assert.equal(request.headers.get("content-type"), "application/json");
  assert.equal(request.headers.get("content-length"), null);
  assert.equal(request.headers.get("x-forwarded-for"), "203.0.113.7", "the rate limit key");
  assert.equal(request.headers.get("cookie"), "theme=dark");
  assert.equal(request.headers.get("origin"), "https://store.example.test");
  assert.deepEqual(await request.json(), {
    name: "Alex",
    email: "alex@example.test",
    password: "correct horse",
    callbackURL: "/cart",
  });
});

test("a refusal is reduced to Better Auth's code", async () => {
  const harness = loadEndpointHarness(() =>
    Response.json({ code: "EMAIL_NOT_VERIFIED", message: "Email not verified" }, { status: 403 }));

  assert.deepEqual(
    await harness.callAuthEndpoint("/sign-in/email", signInBody()),
    { ok: false, code: "EMAIL_NOT_VERIFIED" },
  );
});

test("a rate-limited call reads as RATE_LIMITED", async () => {
  const harness = loadEndpointHarness(() =>
    Response.json({ message: "Too many requests. Please try again later." }, { status: 429 }));

  assert.deepEqual(
    await harness.callAuthEndpoint("/sign-in/email", signInBody()),
    { ok: false, code: "RATE_LIMITED" },
  );
});

test("an unreadable refusal reads as UNKNOWN", async () => {
  for (const respond of [
    () => new Response("<html>Bad gateway</html>", { status: 502 }),
    () => Response.json({ code: "SOMETHING_NEW" }, { status: 400 }),
  ]) {
    const harness = loadEndpointHarness(respond);
    assert.deepEqual(
      await harness.callAuthEndpoint("/sign-in/email", signInBody()),
      { ok: false, code: "UNKNOWN" },
    );
  }
});

test("success returns every Set-Cookie the endpoint set", async () => {
  const harness = loadEndpointHarness(() => {
    const response = Response.json({ token: "t" });
    response.headers.append("set-cookie", "better-auth.session_token=abc; Path=/; HttpOnly");
    response.headers.append("set-cookie", "better-auth.session_data=def; Path=/; HttpOnly");
    return response;
  });

  assert.deepEqual(await harness.callAuthEndpoint("/sign-in/email", signInBody()), {
    ok: true,
    cookies: [
      "better-auth.session_token=abc; Path=/; HttpOnly",
      "better-auth.session_data=def; Path=/; HttpOnly",
    ],
  });
});

function signInBody() {
  return { email: "alex@example.test", password: "correct horse", callbackURL: "/" };
}

function loadEndpointHarness(respond) {
  const requests = [];
  const modules = {
    "server-only": {},
    "next/headers": { headers: async () => visitorHeaders() },
    "@/lib/app-origin": { getCanonicalAppOrigin: () => "https://store.example.test" },
    "@/utils/auth": {
      auth: {
        handler: async (request) => {
          requests.push(request);
          return respond(request);
        },
      },
    },
    "./form-errors": formErrors,
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "endpoint.ts",
  }).outputText;
  const endpointModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    endpointModule,
    endpointModule.exports,
  );
  return { ...endpointModule.exports, requests };
}
