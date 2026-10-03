import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import { NOT_FOUND_INTERNAL_PATH, pathShould404 } from "./lib/routing/unknown-path.ts";

const nativeRequire = createRequire(import.meta.url);
const { NextRequest } = nativeRequire("next/server");
const source = await readFile(new URL("./proxy.ts", import.meta.url), "utf8");

function loadProxy({ principal = null, canManage = false, canonicalRedirect = null } = {}) {
  let principalReads = 0;
  const modules = {
    "@/lib/app-origin": { canonicalRequestRedirect: () => canonicalRedirect },
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
    request: (path) => proxyModule.exports.proxy(new NextRequest(`http://localhost:3000${path}`)),
  };
}

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

test("canonical host redirects still precede protected-route authorization", async () => {
  const canonicalRedirect = new URL("https://shop.example.test/orders/1?from=checkout");
  const proxy = loadProxy({ canonicalRedirect });
  const response = await proxy.request("/orders/1?from=checkout");
  assert.equal(response.headers.get("location"), canonicalRedirect.href);
  assert.equal(proxy.principalReads(), 0);
});
