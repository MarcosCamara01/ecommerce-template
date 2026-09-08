import assert from "node:assert/strict";
import test from "node:test";

import { selectCheckoutCartItems } from "./checkout-selection.ts";

test("an unrelated hidden archived row does not block active requested ids", () => {
  const activeItem = { id: 1 };
  assert.deepEqual(
    selectCheckoutCartItems(
      [
        { cartItemId: 1, active: true, item: activeItem },
        { cartItemId: 2, active: false, item: null },
      ],
      [1],
    ),
    [activeItem],
  );
});

test("an explicitly requested archived or missing row fails closed", () => {
  const first = { id: 1 };
  const state = [
    { cartItemId: 1, active: true, item: first },
    { cartItemId: 2, active: false, item: null },
  ];

  assert.equal(selectCheckoutCartItems(state, [1, 2]), null);
  assert.equal(selectCheckoutCartItems(state, [1, 3]), null);
});

test("a complete active requested set succeeds without partial omission", () => {
  const first = { id: 1 };
  const second = { id: 2 };

  assert.deepEqual(
    selectCheckoutCartItems(
      [
        { cartItemId: 1, active: true, item: first },
        { cartItemId: 2, active: true, item: second },
      ],
      [1, 2],
    ),
    [first, second],
  );
});
