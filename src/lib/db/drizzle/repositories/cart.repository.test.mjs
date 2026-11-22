import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./cart.repository.ts", import.meta.url), "utf8");

test("a cart addition never sums a line past the int4 quantity column", () => {
  const upsert = source.slice(source.indexOf("async function upsertInternal"));

  assert.match(source, /const INT4_MAX = 2_147_483_647;/);
  assert.match(
    upsert,
    /onConflictDoUpdate\(\{[\s\S]*?setWhere: sql`\$\{cartItems\.quantity\} <= \$\{INT4_MAX - data\.quantity\}`/,
  );
  assert.match(upsert, /: \{ status: "quantity_limit_exceeded" \}/);
});
