import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("product params remain runtime data and never require the catalog during build", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /generateStaticParams/);
  assert.match(source, /<Suspense fallback=\{<SingleProductSkeleton \/>\}>/);
  assert.match(source, /<DynamicProductContent params=\{params\} searchParams=\{searchParams\} \/>/);
  assert.match(source, /productId <= 0[\s\S]*?notFound\(\)/);
});
