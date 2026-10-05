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
  let state;
  const modules = {
    react: {
      useState: (initial) => {
        if (state === undefined) state = initial;
        return [state, (next) => { state = next; }];
      },
    },
    "next/link": { __esModule: true, default: "next-link" },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
  );
  return (props) => componentModule.exports.default(props);
}

test("a link waits for intent before its page is fetched ahead", () => {
  const render = mount();
  const idle = render({ href: "/pants" });
  assert.equal(idle.type, "next-link");
  assert.equal(idle.props.href, "/pants");
  assert.equal(idle.props.prefetch, false);

  // Pointer over it, keyboard focus or a finger down: any of them is intent.
  for (const signal of ["onMouseEnter", "onFocus", "onTouchStart"]) {
    const fresh = mount();
    fresh({ href: "/pants" }).props[signal]({});
    assert.equal(fresh({ href: "/pants" }).props.prefetch, null, signal);
  }
});

test("a link keeps the handlers and the choice it was given", () => {
  const calls = [];
  const render = mount();
  const link = render({
    href: "/",
    onMouseEnter: () => calls.push("enter"),
    onFocus: () => calls.push("focus"),
    onTouchStart: () => calls.push("touch"),
  });
  link.props.onMouseEnter({});
  link.props.onFocus({});
  link.props.onTouchStart({});
  assert.deepEqual(calls, ["enter", "focus", "touch"]);

  // The navigation asks ahead as soon as it shows.
  assert.equal(mount()({ href: "/", prefetch: "auto" }).props.prefetch, "auto");
  assert.equal(mount()({ href: "/", prefetch: false }).props.prefetch, false);
});
