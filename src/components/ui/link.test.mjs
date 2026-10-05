import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("./link.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

function mount() {
  const fetched = [];
  const modules = {
    "next/link": { __esModule: true, default: "next-link" },
    "next/navigation": {
      useRouter: () => ({ prefetch: (href) => fetched.push(href) }),
    },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
  );
  return { fetched, render: (props) => componentModule.exports.default(props) };
}

test("a link waits for intent before its page is fetched ahead", () => {
  const idle = mount();
  const link = idle.render({ href: "/pants" });
  assert.equal(link.type, "next-link");
  assert.equal(link.props.href, "/pants");
  // Next's own prefetch stays off: nothing is fetched for a link on show.
  assert.equal(link.props.prefetch, false);
  assert.deepEqual(idle.fetched, []);

  // Pointer over it, keyboard focus or a finger down: any of them is intent.
  for (const signal of ["onMouseEnter", "onFocus", "onTouchStart"]) {
    const fresh = mount();
    fresh.render({ href: "/pants" }).props[signal]({});
    assert.deepEqual(fresh.fetched, ["/pants"], signal);
  }
});

test("a link that is not a plain path is never fetched ahead", () => {
  const link = mount();
  link.render({ href: { pathname: "/pants" } }).props.onMouseEnter({});
  assert.deepEqual(link.fetched, []);
});

test("a link keeps the handlers it was given", () => {
  const calls = [];
  const link = mount().render({
    href: "/",
    onMouseEnter: () => calls.push("enter"),
    onFocus: () => calls.push("focus"),
    onTouchStart: () => calls.push("touch"),
  });
  link.props.onMouseEnter({});
  link.props.onFocus({});
  link.props.onTouchStart({});
  assert.deepEqual(calls, ["enter", "focus", "touch"]);
});
