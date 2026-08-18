import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("empty catalogs still provide a build-time placeholder path", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
  assert.match(source, /products\.length === 0/);
  assert.match(source, /return \[\{ category: "__empty__", id: "0" \}\]/);
  assert.match(source, /productId <= 0[\s\S]*?notFound\(\)/);
});
