import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { fitDisplaySize } from "../../../lib/display-type.ts";
import { pickFirst } from "../../../utils/pickFirst.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

test("long search queries keep a readable heading and reach search unchanged", async () => {
  const query = "W".repeat(2048);
  let searchedQuery;
  const modules = {
    "@/app/actions": { getAllProducts: async () => [] },
    "@/utils": {
      pickFirst,
      searchProducts: (_, value) => { searchedQuery = value; return []; },
    },
    "@/components/products": { ProductItem: "article", ProductsSkeleton: "div" },
    "@/components/products/RailCard": { RailCard: "article" },
    "@/components/search/SearchPill": { SearchPill: () => null },
    "@/lib/display-type": { fitDisplaySize },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: "page.tsx",
  }).outputText;
  const pageModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? nativeRequire(id),
    pageModule,
    pageModule.exports,
  );
  const shell = pageModule.exports.default({ searchParams: Promise.resolve({ q: query }) });
  const results = shell.props.children;
  const html = renderToStaticMarkup(await results.type(results.props));
  const heading = html.match(/<h1\b[^>]*style="([^"]*)"[^>]*>([^<]*)<\/h1>/);

  assert.ok(heading);
  assert.equal(heading[2], `“${query}”`);
  assert.match(heading[1], /--title-m:max\(32px,/);
  assert.match(heading[1], /--title-d:max\(48px,/);
  assert.equal(searchedQuery, query);
});
