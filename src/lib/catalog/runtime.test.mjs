import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import ts from "typescript";

for (const [file, name] of [
  ["search-index.ts", "getSearchCatalog"],
  ["sections.ts", "getShopSectionSummaries"],
]) {
  test(`${name} waits for a request before reading the catalog`, async () => {
    let allowRequest;
    const request = new Promise((resolve) => {
      allowRequest = resolve;
    });
    let catalogReads = 0;
    const products = [{ id: 1, category: "t-shirts", img: "/shirt.jpg" }];
    const modules = {
      "server-only": {},
      "next/server": { connection: () => request },
      "next/cache": { cacheTag() {}, cacheLife() {} },
      "@/constants/navigation": {
        shopSections: [{ key: "new-in" }, { key: "t-shirts" }],
      },
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
        productWithVariantsSchema: { array: () => ({ parse: (value) => value }) },
      },
    };
    const source = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
      fileName: file,
    }).outputText;
    const catalogModule = { exports: {} };
    new Function("require", "module", "exports", compiled)(
      (id) => {
        assert.ok(id in modules, `Unexpected import: ${id}`);
        return modules[id];
      },
      catalogModule,
      catalogModule.exports,
    );

    const result = catalogModule.exports[name]();
    assert.equal(catalogReads, 0, "Prerender must not connect to the database");
    allowRequest();
    assert.ok((await result).length > 0);
    assert.equal(catalogReads, 1, "Request-time data must still reach the catalog");
  });
}
