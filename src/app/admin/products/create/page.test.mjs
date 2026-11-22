import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

function loadPage(capabilities) {
  const modules = {
    "@/components/admin": { CreateProductForm: "create-product-form" },
    "@/lib/identity": {
      requireCapability: async (capability) => {
        if (!capabilities.includes(capability)) throw new Error("CAPABILITY_DENIED");
        return { kind: "user", userId: "user-1", capabilities };
      },
    },
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
  return pageModule.exports.default;
}

async function renderServerTree(node) {
  if (Array.isArray(node)) return Promise.all(node.map(renderServerTree));
  if (!node || typeof node !== "object") return node;
  if (typeof node.type === "function") {
    return renderServerTree(await node.type(node.props));
  }
  return {
    type: node.type,
    children: await renderServerTree(node.props?.children),
  };
}

function containsType(tree, type) {
  if (Array.isArray(tree)) return tree.some((child) => containsType(child, type));
  if (!tree || typeof tree !== "object") return false;
  return tree.type === type || containsType(tree.children, type);
}

test("a user without catalog management never receives the create form", async () => {
  for (const capabilities of [[], ["fulfillment:manage"]]) {
    const page = loadPage(capabilities);
    await assert.rejects(renderServerTree(await page({})), /CAPABILITY_DENIED/);
  }
});

test("a catalog manager receives the create form", async () => {
  const page = loadPage(["catalog:manage"]);
  const tree = await renderServerTree(await page({}));
  assert.equal(containsType(tree, "create-product-form"), true);
});
