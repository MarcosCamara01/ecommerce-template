import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import ts from "typescript";

import * as emailFlows from "../lib/auth/email-flows.ts";

const APP_ORIGIN = "https://shop.example.test";

async function loadRobots() {
  const modules = {
    "@/lib/app-origin": { getCanonicalAppOrigin: () => APP_ORIGIN },
    "@/lib/auth/email-flows": emailFlows,
  };
  const source = await readFile(new URL("./robots.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
    fileName: "robots.ts",
  }).outputText;
  const robotsModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => {
      assert.ok(id in modules, `Unexpected import: ${id}`);
      return modules[id];
    },
    robotsModule,
    robotsModule.exports,
  );
  return robotsModule.exports.default();
}

// RFC 9309: the longest matching rule wins, and allow wins a tie.
function crawlable(robots, path) {
  const rules = [robots.rules].flat().find((rule) => rule.userAgent === "*");
  const longest = (paths) =>
    Math.max(-1, ...[paths ?? []].flat().filter((rule) => path.startsWith(rule)).map((rule) => rule.length));
  return longest(rules.allow) >= longest(rules.disallow);
}

test("crawlers may fetch the storefront", async () => {
  const robots = await loadRobots();
  for (const path of ["/", "/new-in", "/t-shirts", "/pants/12", "/sweatshirts/3?variant=Black", "/help/returns", "/search?q=shirt"]) {
    assert.equal(crawlable(robots, path), true, path);
  }
});

test("crawlers are kept off private, transactional, and account pages", async () => {
  const robots = await loadRobots();
  for (const path of [
    "/admin",
    "/admin/products/create",
    "/api/user/cart",
    "/api/auth/get-session",
    "/cart",
    "/wishlist",
    "/orders",
    "/orders/7",
    "/result?session_id=cs_test_1",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password?token=abc",
    "/email-verification",
  ]) {
    assert.equal(crawlable(robots, path), false, path);
  }
});

test("robots.txt points at the sitemap on the canonical origin", async () => {
  const robots = await loadRobots();
  assert.equal(robots.sitemap, `${APP_ORIGIN}/sitemap.xml`);
});
