import assert from "node:assert/strict";
import test from "node:test";

import {
  ExistingOrderMismatchError,
  assertExistingOrderMatchesFulfillment,
} from "./existing-order-idempotency.ts";

const expectedOrder = {
  userId: "user-1",
  stripeSessionId: "cs_paid_1",
  totalPrice: 8_990,
  currency: "eur",
  products: [
    {
      variantId: 11,
      quantity: 1,
      size: "M",
      unitAmount: 4_995,
      currency: "eur",
      productName: "Durable Tee",
      variantColor: "Black",
      imageUrl: "https://images.example/tee.webp",
    },
    {
      variantId: 22,
      quantity: 2,
      size: "L",
      unitAmount: 1_997,
      currency: "eur",
      productName: "Durable Socks",
      variantColor: "White",
      imageUrl: "https://images.example/socks.webp",
    },
  ],
};

test("a persisted order missing a paid line cannot satisfy fulfillment idempotency", () => {
  assert.throws(
    () =>
      assertExistingOrderMatchesFulfillment(
        { ...expectedOrder, products: expectedOrder.products.slice(0, 1) },
        expectedOrder,
      ),
    (error) =>
      error instanceof ExistingOrderMismatchError &&
      error.code === "existing_order_mismatch",
  );
});

test("an exact persisted order remains idempotent regardless of row order", () => {
  assert.doesNotThrow(() =>
    assertExistingOrderMatchesFulfillment(
      { ...expectedOrder, products: [...expectedOrder.products].reverse() },
      expectedOrder,
    ),
  );
});
