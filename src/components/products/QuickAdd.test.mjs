import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { MutationObserver, QueryClient } from "@tanstack/react-query";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("./QuickAdd.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

test("a size adds that size, flies the photo, bumps the counter and opens the bag", async () => {
  const harness = loadHarness();
  try {
    harness.size("M").onClick();
    assert.deepEqual(harness.submissions, [{ size: "M", variantId: 2 }]);
    assert.equal(harness.size("M")["aria-busy"], true);
    assert.deepEqual(harness.effects, { flights: 0, bumps: 0, opened: [] });

    harness.resolve({ id: 7 });
    await harness.completion();
    await new Promise(setImmediate);
    assert.equal(harness.effects.flights, 1);
    assert.equal(harness.effects.bumps, 1);
    assert.equal(harness.size("M")["aria-busy"], undefined);
    assert.equal(harness.label("M"), "✓");

    harness.runTimers();
    assert.deepEqual(harness.effects.opened, [
      { name: "T-Shirt", color: "Blue", size: "M" },
    ]);
    assert.equal(harness.label("M"), "M", "the tick gives way to the size again");
  } finally {
    harness.dispose();
  }
});

test("a second click while one size is being added adds nothing", () => {
  const harness = loadHarness();
  try {
    harness.size("M").onClick();
    harness.size("L").onClick();
    assert.deepEqual(harness.submissions, [{ size: "M", variantId: 2 }]);
  } finally {
    harness.dispose();
  }
});

test("a rejected add confirms nothing and leaves the sizes ready to try again", async () => {
  const harness = loadHarness();
  try {
    harness.size("M").onClick();
    harness.reject(new Error("Request rejected"));
    await assert.rejects(harness.completion(), { message: "Request rejected" });
    assert.deepEqual(harness.effects, { flights: 0, bumps: 0, opened: [] });
    assert.equal(harness.size("M")["aria-busy"], undefined);
    assert.equal(harness.label("M"), "M");

    harness.size("L").onClick();
    assert.equal(harness.submissions.length, 2);
  } finally {
    harness.dispose();
  }
});

test("each size says what it adds, and the sizes are a single tab stop", () => {
  const harness = loadHarness();
  try {
    const root = harness.render();
    assert.equal(root.props["aria-label"], "Quick add T-Shirt");
    assert.equal(harness.size("L")["aria-label"], "Add T-Shirt, size L, to bag");
    assert.deepEqual(harness.sizes().map((button) => button.tabIndex), [0, -1, -1]);
  } finally {
    harness.dispose();
  }
});

test("a piece with no sizes in stock has no quick add", () => {
  const harness = loadHarness({ sizes: [] });
  try {
    assert.equal(harness.render(), null);
  } finally {
    harness.dispose();
  }
});

function loadHarness({ sizes = ["S", "M", "L"] } = {}) {
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
  const slots = [];
  const timers = [];
  const submissions = [];
  const effects = { flights: 0, bumps: 0, opened: [] };
  let slot = 0;
  let completion;
  let resolve;
  let reject;
  const request = new Promise((accept, decline) => { resolve = accept; reject = decline; });
  void request.catch(() => {});
  const observer = new MutationObserver(client, { mutationFn: () => request });
  const unsubscribe = observer.subscribe(() => {});
  const modules = {
    react: {
      useState: (initial) => {
        const index = slot++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], (value) => { slots[index] = value; }];
      },
      useRef: (initial) => {
        const index = slot++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useEffect: () => {},
    },
    "@/utils/product-name": { displayName: (name) => name },
    "@/components/bag/bag-ui": {
      bumpBag: () => { effects.bumps += 1; },
      openBag: (line) => { effects.opened.push(line); },
    },
    "@/components/bag/fly-to-bag": {
      flyToBag: () => { effects.flights += 1; return Promise.resolve(); },
    },
    "@/components/ui/loader": { SVGLoadingIcon: "spinner" },
    "@/hooks/cart": {
      useCartMutation: () => ({
        add: (variables, callbacks) => {
          submissions.push(variables);
          completion = observer.mutate(variables, callbacks);
          void completion.catch(() => {});
        },
      }),
    },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", "window", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
    { setTimeout: (callback) => timers.push(callback), clearTimeout: () => {} },
  );
  const render = () => {
    slot = 0;
    return componentModule.exports.QuickAdd({
      product: { name: "T-Shirt", price: 25 },
      variant: { id: 2, color: "Blue", sizes, images: ["/photo.jpg"] },
      flySource: () => null,
    });
  };
  const buttons = () => render().props.children[1].map((button) => button.props);
  const size = (value) => buttons()[sizes.indexOf(value)];
  return {
    render, submissions, effects, resolve, reject, size,
    sizes: buttons,
    label: (value) => size(value).children.props.children,
    completion: () => completion,
    runTimers: () => timers.splice(0).forEach((callback) => callback()),
    dispose() { reject(new Error("Test cleanup")); unsubscribe(); client.clear(); },
  };
}
