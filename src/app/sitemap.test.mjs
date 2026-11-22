import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import ts from "typescript";

import * as navigation from "../constants/navigation.ts";

const APP_ORIGIN = "https://shop.example.test";

async function loadModule(url, modules) {
  const source = await readFile(url, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
    fileName: url.pathname,
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => {
      assert.ok(id in modules, `Unexpected import: ${id}`);
      return modules[id];
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

async function loadSitemap(products) {
  let allowRequest;
  const request = new Promise((resolve) => {
    allowRequest = resolve;
  });
  const cachedUnder = [];
  let catalogReads = 0;
  const { default: sitemap } = await loadModule(new URL("./sitemap.ts", import.meta.url), {
    "next/server": { connection: () => request },
    "next/cache": { cacheTag: (...tags) => cachedUnder.push(...tags), cacheLife() {} },
    "@/constants/navigation": navigation,
    "@/lib/app-origin": { getCanonicalAppOrigin: () => APP_ORIGIN },
    "@/lib/data-access": {
      dataAccess: {
        catalog: {
          list: async () => {
            catalogReads += 1;
            return products;
          },
        },
      },
    },
    "@/lib/db/drizzle/schema": {
      ProductCategoryZod: { options: ["t-shirts", "pants", "sweatshirts"] },
    },
  });
  return { sitemap, allowRequest, cachedUnder, catalogReads: () => catalogReads };
}

test("the sitemap lists the storefront pages and every live product on the canonical origin", async () => {
  const { sitemap, allowRequest } = await loadSitemap([
    { id: 12, category: "pants", updatedAt: "2026-11-01T10:00:00.000Z" },
    { id: 3, category: "t-shirts", updatedAt: "2026-10-20T08:30:00.000Z" },
  ]);
  allowRequest();
  assert.deepEqual(await sitemap(), [
    { url: `${APP_ORIGIN}/` },
    { url: `${APP_ORIGIN}/new-in` },
    { url: `${APP_ORIGIN}/t-shirts` },
    { url: `${APP_ORIGIN}/pants` },
    { url: `${APP_ORIGIN}/sweatshirts` },
    { url: `${APP_ORIGIN}/help/size-guide` },
    { url: `${APP_ORIGIN}/help/delivery` },
    { url: `${APP_ORIGIN}/help/returns` },
    { url: `${APP_ORIGIN}/pants/12`, lastModified: "2026-11-01T10:00:00.000Z" },
    { url: `${APP_ORIGIN}/t-shirts/3`, lastModified: "2026-10-20T08:30:00.000Z" },
  ]);
});

test("the sitemap reads the catalog at request time, never while prerendering", async () => {
  const { sitemap, allowRequest, catalogReads } = await loadSitemap([]);
  const result = sitemap();
  await Promise.resolve();
  assert.equal(catalogReads(), 0, "Prerender must not connect to the database");
  allowRequest();
  await result;
  assert.equal(catalogReads(), 1);
});

test("a catalog change revalidates the sitemap", async () => {
  const { sitemap, allowRequest, cachedUnder } = await loadSitemap([]);
  allowRequest();
  await sitemap();

  const revalidated = [];
  const { revalidateProducts } = await loadModule(
    new URL("../lib/catalog-sync/revalidate.ts", import.meta.url),
    {
      "server-only": {},
      "next/cache": { revalidateTag: (tag) => revalidated.push(tag) },
    },
  );
  await revalidateProducts(12);

  assert.ok(cachedUnder.length > 0, "the sitemap must be cached");
  for (const tag of cachedUnder) assert.ok(revalidated.includes(tag), tag);
});
