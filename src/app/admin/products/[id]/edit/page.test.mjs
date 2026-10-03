import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

import { parsePositiveIntegerId } from "../../../../../lib/routing/positive-integer-id.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

function loadPage() {
  const reads = [];
  const readProduct = async (_, id) => {
    reads.push(id);
    return { id };
  };
  const modules = {
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
    "@/components/admin": { EditProductForm: "edit-product-form" },
    "@/lib/identity": { requireCapability: async () => ({ kind: "user" }) },
    "@/services/products.service": {
      getProductByIdForManager: readProduct,
      getArchivedProductForRestoration: readProduct,
    },
    "@/components/ui/skeleton": { Skeleton: "skeleton" },
    "@/lib/routing/positive-integer-id": { parsePositiveIntegerId },
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
  return {
    reads,
    render: async (id, restore) => {
      const shell = await pageModule.exports.default({
        params: Promise.resolve({ id }),
        searchParams: Promise.resolve({ restore }),
      });
      const content = shell.props.children;
      return content.type(content.props);
    },
  };
}

test("malformed admin edit IDs never read a different product", async () => {
  for (const id of ["1abc", "1e2", "1.5", "-1", "0", "9007199254740993"]) {
    const page = loadPage();
    await assert.rejects(page.render(id), /NOT_FOUND/, id);
    assert.deepEqual(page.reads, [], id);
  }
});

test("valid admin edit and restore IDs retain their durable identity", async () => {
  for (const restore of [undefined, "1"]) {
    const page = loadPage();
    const form = await page.render("42", restore);
    assert.deepEqual(page.reads, [42]);
    assert.equal(form.props.product.id, 42);
    assert.equal(form.props.restoreArchived, restore === "1");
  }
});
