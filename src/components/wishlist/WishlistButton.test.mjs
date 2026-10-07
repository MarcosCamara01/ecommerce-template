import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("wishlist hydration renders a stable server and client placeholder", async () => {
  const source = await readFile(
    new URL("./WishlistButton.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /useSyncExternalStore/);
  assert.match(source, /const isHydrated = useSyncExternalStore/);
  assert.match(source, /if \(!isHydrated \|\| isLoading\)/);
});

test("saving plays the sparks without taking room from the button", async () => {
  const { createRequire } = await import("node:module");
  const { default: ts } = await import("typescript");
  const require = createRequire(import.meta.url);
  const source = await readFile(
    new URL("./WishlistButton.tsx", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const saved = new Set();
  const slots = [];
  let slot = 0;
  const modules = {
    react: {
      useState: (initial) => {
        const index = slot++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], (next) => {
          slots[index] = typeof next === "function" ? next(slots[index]) : next;
        }];
      },
      useSyncExternalStore: (_, snapshot) => snapshot(),
    },
    ahooks: { useThrottleFn: (run) => ({ run }) },
    sonner: { toast: () => {} },
    "@/hooks/wishlist": {
      useWishlist: () => ({ isInWishlist: (id) => saved.has(id), isLoading: false }),
    },
    "@/hooks/wishlist/mutations/useWishlistMutation": {
      useWishlistMutation: () => ({
        add: (id) => saved.add(id),
        remove: ({ productId }) => saved.delete(productId),
      }),
    },
    "@/lib/auth/client": { useSession: () => ({ data: { user: { id: "qa" } } }) },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "@/components/icons": { HeartIcon: "heart" },
    "@/components/ui/skeleton": { Skeleton: "skeleton" },
  };
  const componentModule = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => modules[id] ?? require(id), componentModule, componentModule.exports,
  );
  const render = () => {
    slot = 0;
    const root = componentModule.exports.default({ productId: 1, productName: "T-Shirt" });
    const [sparks, button] = root.props.children;
    return { root, sparks, button };
  };

  const before = render();
  assert.equal(before.sparks, null);
  assert.match(before.root.props.className, /\bgrid\b/);
  assert.match(before.button.props.className, /\bsize-full\b/);

  before.button.props.onClick();
  const after = render();
  assert.equal(after.button.props["aria-pressed"], true);
  assert.equal(after.sparks.props.children.length, 8);
  // The button's box is a grid: anything else in flow would share it and
  // squash the button, so the sparks must sit out of flow.
  assert.match(after.sparks.props.className, /\babsolute\b/);
  assert.match(after.sparks.props.className, /\binset-0\b/);
  assert.equal(after.button.props.className, before.button.props.className
    .replace("bg-white/85 text-[#111214]", "bg-[#111214] text-white"));

  // Removing keeps the same box too: the celebration never comes back out.
  after.button.props.onClick();
  const removed = render();
  assert.equal(removed.button.props["aria-pressed"], false);
  assert.match(removed.sparks.props.className, /\babsolute\b/);
});
