import assert from "node:assert/strict";
import test from "node:test";
import { tsImport } from "tsx/esm/api";

const { addToCartSchema, updateCartItemSchema } = await tsImport(
  "./cart.ts",
  import.meta.url,
);

// Exercise the schemas the HTTP handlers actually use, without replacing them.
test("cart updates reject invalid item ids", () => {
  for (const id of [1.5, -1, 0, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(updateCartItemSchema.safeParse({ id, quantity: 1 }).success, false);
  }
  assert.deepEqual(updateCartItemSchema.parse({ id: 1, quantity: 2 }), {
    id: 1,
    quantity: 2,
  });
});

test("cart quantities fit the PostgreSQL integer column", () => {
  for (const quantity of [0, -1, 1.5, 2_147_483_648]) {
    assert.equal(
      addToCartSchema.safeParse({ variantId: 1, size: "M", quantity }).success,
      false,
    );
    assert.equal(
      updateCartItemSchema.safeParse({ id: 1, quantity }).success,
      false,
    );
  }
});
