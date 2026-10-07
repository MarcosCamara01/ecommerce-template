import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import * as React from "react";
import { tsImport } from "tsx/esm/api";
import ts from "typescript";

const require = createRequire(import.meta.url);
const group = await tsImport("../input-group.tsx", import.meta.url);
const utils = await tsImport("../../../lib/utils.ts", import.meta.url);
const source = readFileSync(new URL("./PasswordInput.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

function passwordHarness(props = {}, ref = { current: null }) {
  let visible = false;
  const modules = {
    react: {
      ...React,
      useState: () => [visible, (next) => {
        visible = typeof next === "function" ? next(visible) : next;
      }],
    },
    "@/components/ui/input-group": group,
    "@/lib/utils": utils,
    "react-icons/ai": { AiOutlineEye: "svg", AiOutlineEyeInvisible: "svg" },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
  );

  // Traverse the real InputGroup -> Input and Button composition down to hosts.
  function expand(element) {
    if (!element || typeof element !== "object") return element;
    if (Array.isArray(element)) return element.map(expand);
    if (typeof element.type === "function") return expand(element.type(element.props));
    if (typeof element.type?.render === "function") return expand(element.type.render(element.props, element.props.ref));
    return { ...element, props: { ...element.props, children: expand(element.props.children) } };
  }

  return { render: () => expand(componentModule.exports.PasswordInput.render(props, ref)) };
}

function controls(tree) {
  const found = {};
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.type === "input") found.input = node;
    if (node.type === "button") found.button = node;
    visit(node.props?.children);
  };
  visit(tree);
  return found;
}

test("password uses the shared input with ref, value and native validation props", () => {
  const ref = { current: null };
  const onChange = () => {};
  const props = {
    id: "account-password", name: "credential", placeholder: "Choose a password",
    value: "typed-password", onChange, required: true, minLength: 8, maxLength: 128,
    autoComplete: "new-password", "aria-invalid": true, "aria-describedby": "password-error",
  };
  const { input } = controls(passwordHarness(props, ref).render());
  assert.equal(input.props.ref, ref);
  assert.equal(input.props["data-slot"], "input-group-control");
  assert.equal(input.props.type, "password");
  for (const [name, value] of Object.entries(props)) assert.equal(input.props[name], value);
});

test("password defaults and uncontrolled values survive the group composition", () => {
  const { input } = controls(passwordHarness({ defaultValue: "initial-password" }).render());
  assert.equal(input.props.name, "password");
  assert.equal(input.props.placeholder, "Password");
  assert.equal(input.props.defaultValue, "initial-password");
});

test("disabled password disables the input and its reveal button", () => {
  const { input, button } = controls(passwordHarness({ disabled: true }).render());
  assert.equal(input.props.disabled, true);
  assert.equal(button.props.disabled, true);
  assert.equal(button.props.type, "button");
  assert.equal(button.props["aria-label"], "Show password");
});

test("password visibility toggles preserve the value and use the latest state", () => {
  const harness = passwordHarness({ value: "typed-password", onChange: () => {} });
  const initial = controls(harness.render());
  initial.button.props.onClick({ preventDefault() {} });
  const revealed = controls(harness.render());
  assert.equal(revealed.input.props.type, "text");
  assert.equal(revealed.input.props.value, "typed-password");
  assert.equal(revealed.button.props["aria-label"], "Hide password");
  assert.equal(revealed.button.props["aria-pressed"], true);
  revealed.button.props.onClick({ preventDefault() {} });
  revealed.button.props.onClick({ preventDefault() {} });
  assert.equal(controls(harness.render()).input.props.type, "text");
});
