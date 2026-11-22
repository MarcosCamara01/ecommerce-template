import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import { NOT_FOUND_INTERNAL_PATH, pathShould404 } from "./lib/routing/unknown-path.ts";

const nativeRequire = createRequire(import.meta.url);
const { NextRequest } = nativeRequire("next/server");
const source = await readFile(new URL("./proxy.ts", import.meta.url), "utf8");

const APP_ORIGIN = "http://localhost:3000";

function loadProxy({ principal = null, canManage = false, canonicalRedirect = null } = {}) {
  let principalReads = 0;
  const modules = {
    "@/lib/app-origin": {
      canonicalRequestRedirect: () => canonicalRedirect,
      getCanonicalAppOrigin: () => APP_ORIGIN,
    },
    "@/lib/identity": {
      getPrincipalFromHeaders: async () => { principalReads += 1; return principal; },
      hasCapability: () => canManage,
    },
    "@/lib/routing/unknown-path": { NOT_FOUND_INTERNAL_PATH, pathShould404 },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
    fileName: "proxy.ts",
  }).outputText;
  const proxyModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? nativeRequire(id),
    proxyModule,
    proxyModule.exports,
  );
  return {
    principalReads: () => principalReads,
    request: (path, init) => proxyModule.exports.proxy(new NextRequest(`${APP_ORIGIN}${path}`, init)),
  };
}

const COOKIE_WRITE_ROUTES = [
  "/api/user/cart",
  "/api/user/wishlist",
  "/api/stripe/payment",
  "/api/admin/products",
  "/api/admin/catalog-sync/replay",
  "/api/admin/fulfillment/replay",
  "/api/auth/update-user",
];
const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

function write(method, { origin, cookie = "better-auth.session_token=x" } = {}) {
  const headers = new Headers();
  if (origin !== undefined) headers.set("origin", origin);
  if (cookie) headers.set("cookie", cookie);
  return { method, headers };
}

test("cookie-bearing writes from another origin or without one are refused", async () => {
  const proxy = loadProxy();
  for (const path of COOKIE_WRITE_ROUTES) {
    for (const method of WRITE_METHODS) {
      for (const origin of ["https://evil.example", "http://localhost:3000.evil.example", "null", undefined]) {
        const label = `${method} ${path} origin=${origin}`;
        const response = await proxy.request(path, write(method, { origin }));
        assert.equal(response.status, 403, label);
        assert.deepEqual(await response.json(), { error: "invalid_origin" }, label);
        assert.equal(response.headers.get("x-middleware-next"), null, label);
      }
    }
  }
});

test("same-origin writes and writes without a cookie reach the route", async () => {
  const proxy = loadProxy();
  const passing = {
    "same origin": { origin: APP_ORIGIN },
    "no cookie, other origin": { origin: "https://evil.example", cookie: null },
    "no cookie, no origin": { cookie: null },
  };
  for (const path of COOKIE_WRITE_ROUTES) {
    for (const method of WRITE_METHODS) {
      for (const [name, options] of Object.entries(passing)) {
        const response = await proxy.request(path, write(method, options));
        assert.equal(response.headers.get("x-middleware-next"), "1", `${method} ${path} ${name}`);
      }
    }
  }
});

test("reads are not origin-checked", async () => {
  const proxy = loadProxy();
  for (const path of COOKIE_WRITE_ROUTES) {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const response = await proxy.request(path, write(method, { origin: "https://evil.example" }));
      assert.equal(response.headers.get("x-middleware-next"), "1", `${method} ${path}`);
    }
  }
});

test("webhooks, cron jobs, and Better Auth keep their own credential checks", async () => {
  const proxy = loadProxy();
  for (const path of ["/api/stripe/webhooks", "/api/cron/fulfillment", "/api/cron/catalog-sync", "/api/auth/sign-in/email", "/api/auth/email-form"]) {
    for (const method of ["GET", "POST"]) {
      const response = await proxy.request(path, write(method, { origin: "https://evil.example" }));
      assert.equal(response.headers.get("x-middleware-next"), "1", `${method} ${path}`);
    }
  }
});

test("unknown paths sharing a protected prefix reach 404 handling without auth", async () => {
  for (const path of ["/orders-archive", "/admin-anything", "/orders2", "/administrator"]) {
    const proxy = loadProxy();
    const response = await proxy.request(path);
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(new URL(response.headers.get("x-middleware-rewrite")).pathname, NOT_FOUND_INTERNAL_PATH, path);
    assert.equal(proxy.principalReads(), 0, path);
  }
});

test("real protected paths still redirect anonymous visitors to login", async () => {
  for (const path of ["/orders", "/orders/1", "/admin", "/admin/products", "/admin/products/create"]) {
    const proxy = loadProxy();
    const response = await proxy.request(path);
    assert.equal(response.status, 307, path);
    assert.equal(new URL(response.headers.get("location")).pathname, "/login", path);
    assert.equal(proxy.principalReads(), 1, path);
  }
});

test("orders admit signed-in users while admin descendants require catalog capability", async () => {
  const user = loadProxy({ principal: { kind: "user" } });
  assert.equal((await user.request("/orders/1")).headers.get("x-middleware-next"), "1");
  for (const path of ["/admin", "/admin/products/create"]) {
    const response = await user.request(path);
    assert.equal(new URL(response.headers.get("location")).pathname, "/", path);
  }
  const manager = loadProxy({ principal: { kind: "user" }, canManage: true });
  assert.equal((await manager.request("/admin/products/create")).headers.get("x-middleware-next"), "1");
});

test("scheduled jobs run on the deployment host instead of being redirected", async () => {
  const proxy = loadProxy({ canonicalRedirect: new URL("https://shop.example.test/") });
  for (const path of ["/api/cron/fulfillment", "/api/cron/catalog-sync"]) {
    const response = await proxy.request(path);
    assert.equal(response.headers.get("location"), null, path);
    assert.equal(response.headers.get("x-middleware-next"), "1", path);
  }
  const page = await proxy.request("/api/cron");
  assert.equal(page.headers.get("location"), "https://shop.example.test/", "only job routes skip the redirect");
});

test("canonical host redirects still precede protected-route authorization", async () => {
  const canonicalRedirect = new URL("https://shop.example.test/orders/1?from=checkout");
  const proxy = loadProxy({ canonicalRedirect });
  const response = await proxy.request("/orders/1?from=checkout");
  assert.equal(response.headers.get("location"), canonicalRedirect.href);
  assert.equal(proxy.principalReads(), 0);
});
