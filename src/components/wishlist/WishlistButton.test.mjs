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
