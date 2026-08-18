import assert from "node:assert/strict";
import test from "node:test";

import { remainingCartQuantity } from "./remaining-quantity.ts";

test("cart cleanup preserves units added after checkout", () => {
  assert.equal(remainingCartQuantity(5, 2), 3);
});

test("cart cleanup removes a row once all current units were purchased", () => {
  assert.equal(remainingCartQuantity(2, 2), null);
  assert.equal(remainingCartQuantity(1, 2), null);
});
