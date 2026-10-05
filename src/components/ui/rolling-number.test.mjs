import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("./rolling-number.tsx", import.meta.url), "utf8");
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
        return [
          state,
          (next) => { state = typeof next === "function" ? next(state) : next; },
        ];
      },
    },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
  );
  return (props) => componentModule.exports.RollingNumber(props);
}

test("a figure does not roll when it first appears", () => {
  const render = mount();
  const figure = render({ value: 2 });
  assert.equal(figure.props.className, "inline-block");
  assert.equal(figure.props.style, undefined);
  assert.equal(figure.props.children, 2);
});

test("a figure rolls up when it grows and down when it shrinks", () => {
  const render = mount();
  render({ value: 2 });

  const grown = render({ value: 3 });
  assert.equal(grown.key, "3", "a new figure is a new element, so it plays");
  assert.match(grown.props.className, /\banimate-roll\b/);
  assert.equal(grown.props.style["--roll"], "45%");

  const shrunk = render({ value: 1, children: "€1.00" });
  assert.equal(shrunk.props.style["--roll"], "-45%");
  assert.equal(shrunk.props.children, "€1.00");

  // Rendering again with the same figure keeps the element: no replay.
  assert.equal(render({ value: 1, children: "€1.00" }).key, "1");
});

test("a figure that has rolled is a plain figure again", () => {
  const render = mount();
  render({ value: 2 });
  const rolled = render({ value: 3 });
  assert.equal(typeof rolled.props.onAnimationEnd, "function");

  // A page that comes back on screen restarts CSS animations still set.
  rolled.props.onAnimationEnd();
  const settled = render({ value: 3 });
  assert.equal(settled.key, "3");
  assert.equal(settled.props.className, "inline-block");
  assert.equal(settled.props.style, undefined);
  assert.equal(settled.props.onAnimationEnd, undefined);

  // And it still knows which way the next change goes.
  assert.equal(render({ value: 2 }).props.style["--roll"], "-45%");
});
