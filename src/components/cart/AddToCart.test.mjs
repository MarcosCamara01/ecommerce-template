import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import { MutationObserver, QueryClient } from "@tanstack/react-query";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("./AddToCart.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

for (const desktop of [true, false]) {
  test(`${desktop ? "desktop" : "mobile"} additions wait for success and remain retryable after rejection`, async () => {
    const harness = loadHarness({ desktop });
    try {
      harness.render().button.onClick();
      await new Promise(setImmediate);
      assert.equal(harness.render().button["aria-busy"], true);
      assert.equal(harness.render().button.disabled, false, "a busy button keeps keyboard focus");
      harness.render().button.onClick();
      assert.equal(harness.submissions.length, 1, "a click while adding adds nothing");
      harness.assertNoConfirmation();

      harness.reject(new Error("Request rejected"));
      await assert.rejects(harness.completion(), { message: "Request rejected" });
      assert.equal(harness.render().button["aria-busy"], undefined);
      harness.assertNoConfirmation();

      harness.render().button.onClick();
      assert.equal(harness.submissions.length, 2, "a failed add must still be an add button");
      await assert.rejects(harness.completion(), { message: "Request rejected" });
    } finally {
      harness.dispose();
    }
  });
}

test("desktop success flies the photo, confirms the addition and opens the bag", async () => {
  const harness = loadHarness({ desktop: true });
  try {
    harness.render().button.onClick();
    harness.resolve({ id: 7 });
    await harness.completion();
    assert.deepEqual(harness.submissions, [{ size: "M", variantId: 2 }]);
    assert.equal(harness.effects.flights, 1);
    assert.equal(harness.effects.bumps, 1);
    assert.equal(harness.render().button.children, "Added ✓ — view bag");
    assert.equal(harness.render().sheet.item, null);
    harness.runTimers();
    assert.deepEqual(harness.effects.opened, [{ name: "T-Shirt", color: "Blue", size: "M" }]);

    harness.render().button.onClick();
    assert.equal(harness.submissions.length, 1);
    assert.equal(harness.effects.opened.length, 2);
  } finally {
    harness.dispose();
  }
});

test("mobile success opens the Added sheet with the bought item", async () => {
  const harness = loadHarness({ desktop: false });
  try {
    harness.render().button.onClick();
    harness.resolve({ id: 7 });
    await harness.completion();
    assert.deepEqual(harness.render().sheet.item, {
      name: "T-Shirt", color: "Blue", size: "M", price: 25, image: "/photo.jpg",
    });
    assert.deepEqual(harness.effects, { flights: 0, bumps: 0, opened: [] });
  } finally {
    harness.dispose();
  }
});

test("an attempt without a selected size submits nothing", () => {
  const harness = loadHarness({ desktop: true, size: undefined });
  try {
    harness.render().button.onClick();
    assert.deepEqual(harness.submissions, []);
    harness.assertNoConfirmation();
  } finally {
    harness.dispose();
  }
});

function loadHarness({ desktop, ...options }) {
  const client = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 } } });
  const states = [];
  const timers = [];
  const submissions = [];
  const effects = { flights: 0, bumps: 0, opened: [] };
  let stateIndex = 0;
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
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (value) => { states[index] = value; }];
      },
    },
    ahooks: { useThrottleFn: (run) => ({ run }) },
    "@/utils/product-name": { displayName: (name) => name },
    "@/components/bag/AddedSheet": { AddedSheet: "added-sheet" },
    "@/components/bag/bag-ui": {
      bumpBag: () => { effects.bumps += 1; },
      openBag: (line) => { effects.opened.push(line); },
    },
    "@/components/bag/fly-to-bag": {
      flyToBag: () => { effects.flights += 1; return Promise.resolve(); },
    },
    "@/components/ui/button": { Button: "button" },
    "@/hooks/cart": {
      useCartMutation: () => ({
        add: (variables, callbacks) => {
          submissions.push(variables);
          completion = observer.mutate(variables, callbacks);
          void completion.catch(() => {});
        },
        isAdding: observer.getCurrentResult().isPending,
      }),
    },
    "@/hooks/useHydrated": { useHydrated: () => true },
    "@/lib/auth/client": { useSession: () => ({ data: { user: { id: "qa" } } }) },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "@/utils/formatters": { formatPriceFromEuros: () => "€25.00" },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", "window", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
    { matchMedia: () => ({ matches: desktop }), setTimeout: (callback) => timers.push(callback) },
  );
  const render = () => {
    stateIndex = 0;
    const element = componentModule.exports.AddToCart({
      product: { name: "T-Shirt", price: 25 },
      selectedVariant: { id: 2, color: "Blue", sizes: ["M"], images: ["/photo.jpg"] },
      size: "size" in options ? options.size : "M",
      flySource: () => null,
    });
    const [button, sheet] = element.props.children;
    return { button: button.props, sheet: sheet.props };
  };
  return {
    render, submissions, effects, resolve, reject,
    completion: () => completion,
    runTimers: () => timers.splice(0).forEach((callback) => callback()),
    assertNoConfirmation() {
      assert.deepEqual(effects, { flights: 0, bumps: 0, opened: [] });
      assert.equal(render().sheet.item, null);
      assert.match(render().button.children, /^Add M? ?to bag/);
    },
    dispose() { reject(new Error("Test cleanup")); unsubscribe(); client.clear(); },
  };
}
