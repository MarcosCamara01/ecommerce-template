import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(new URL("./BasicInfo.tsx", import.meta.url), "utf8");

function loadBasicInfo(initialData) {
  const values = [];
  let cursor = 0;
  const ref = { current: null };
  const modules = {
    react: {
      forwardRef: (render) => render,
      useState: (initial) => {
        const index = cursor++;
        if (!(index in values)) {
          values[index] = typeof initial === "function" ? initial() : initial;
        }
        return [values[index], (value) => { values[index] = value; }];
      },
      useImperativeHandle: (target, create) => { target.current = create(); },
    },
    "@/components/ui/input": { Input: "input" },
    "@/components/ui/label": { Label: "label" },
    "@/components/ui/textarea": { Textarea: "textarea" },
    "@/components/ui/select": {
      Select: "select", SelectContent: "select-content", SelectItem: "option",
      SelectTrigger: "select-trigger", SelectValue: "select-value",
    },
    "@/lib/utils": { cn: () => "" },
    "@/lib/stripe/amount-limits": { STRIPE_EUR_MAX_CHARGE_CENTS: 99_999_999 },
    "@/lib/catalog-sync/input-validation": {
      CATALOG_PRODUCT_DESCRIPTION_MAX_LENGTH: 10_000,
      CATALOG_PRODUCT_NAME_MAX_LENGTH: 255,
    },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    fileName: "BasicInfo.tsx",
  }).outputText;
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? nativeRequire(id),
    componentModule,
    componentModule.exports,
  );
  return {
    ref,
    render: () => {
      cursor = 0;
      return componentModule.exports.BasicInfo({ initialData }, ref);
    },
  };
}

function findField(node, id) {
  if (!node || typeof node !== "object") return undefined;
  if (node.props?.id === id) return node;
  const children = [node.props?.children].flat();
  for (const child of children) {
    const match = findField(child, id);
    if (match) return match;
  }
}

for (const initialData of [
  undefined,
  { name: "Original shirt", description: "Original description", price: 25, category: "t-shirts" },
]) {
  test(`basic info reset ${initialData ? "restores the original product" : "clears a new product"}`, () => {
    const form = loadBasicInfo(initialData);
    const fields = form.render();
    findField(fields, "name").props.onChange({ target: { value: "Edited name" } });
    findField(fields, "description").props.onChange({ target: { value: "Edited description" } });
    findField(fields, "price").props.onChange({ target: { value: "50" } });
    form.render();
    assert.equal(form.ref.current.name, "Edited name");

    form.ref.current.reset();
    form.render();
    const { name, description, price, category } = form.ref.current;
    assert.deepEqual({ name, description, price, category }, {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price?.toString() ?? "",
      category: initialData?.category ?? "",
    });
  });
}
