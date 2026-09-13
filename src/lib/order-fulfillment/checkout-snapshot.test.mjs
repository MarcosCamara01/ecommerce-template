import assert from "node:assert/strict";
import test from "node:test";

import {
  assertReferencedVariantsExist,
  createCheckoutMetadata,
  parseStripeChargedLineItem,
  reconcileChargedItems,
} from "./checkout-snapshot.ts";

const snapshot = [
  { cartItemId: 1, variantId: 10, size: "M", quantity: 1, priceId: "price_same", unitAmount: 2999, currency: "eur" },
  { cartItemId: 2, variantId: 10, size: "L", quantity: 2, priceId: "price_same", unitAmount: 2999, currency: "eur" },
];

test("checkout metadata carries only the durable intent reference", () => {
  assert.deepEqual(createCheckoutMetadata("intent-1"), {
    checkoutIntentId: "intent-1",
  });
});

test("reconciliation accepts Stripe aggregation for the same price", () => {
  const result = reconcileChargedItems(snapshot, [
    { priceId: "price_same", quantity: 3, unitAmount: 2999, currency: "eur" },
  ]);
  assert.deepEqual(result.map(({ unitAmount, currency }) => ({ unitAmount, currency })), [
    { unitAmount: 2999, currency: "eur" },
    { unitAmount: 2999, currency: "eur" },
  ]);
});

test("reconciliation rejects quantity drift", () => {
  assert.throws(
    () => reconcileChargedItems(snapshot, [
      { priceId: "price_same", quantity: 2, unitAmount: 2999, currency: "eur" },
    ]),
    /do not match/,
  );
});

test("paid reconciliation survives legitimate catalog edits and later archival", () => {
  const reconciled = reconcileChargedItems(snapshot, [
    { priceId: "price_same", quantity: 3, unitAmount: 2999, currency: "eur" },
  ]);

  assert.doesNotThrow(() =>
    assertReferencedVariantsExist(reconciled, [
      {
        id: 10,
        stripeId: "price_replaced_after_checkout",
        sizes: ["XS"],
        archivedAt: "2026-08-14T00:00:00.000Z",
      },
    ])
  );
  assert.deepEqual(
    reconciled.map(({ size, priceId }) => ({ size, priceId })),
    [
      { size: "M", priceId: "price_same" },
      { size: "L", priceId: "price_same" },
    ],
  );
});

test("missing historical identity is an explicit permanent failure", () => {
  const reconciled = reconcileChargedItems(snapshot, [
    { priceId: "price_same", quantity: 3, unitAmount: 2999, currency: "eur" },
  ]);
  assert.throws(
    () => assertReferencedVariantsExist(reconciled, []),
    (error) =>
      error.code === "historical_catalog_identity_missing" &&
      error.retryable === false,
  );
});

test("paid reconciliation rejects a missing durable variant reference", () => {
  const reconciled = reconcileChargedItems(snapshot, [
    { priceId: "price_same", quantity: 3, unitAmount: 2999, currency: "eur" },
  ]);
  assert.throws(
    () => assertReferencedVariantsExist(reconciled, [{ id: 99 }]),
    /missing variant 10/,
  );
});

test("reconciliation rejects paid price-id tampering", () => {
  assert.throws(
    () => reconcileChargedItems(snapshot, [
      { priceId: "price_other", quantity: 3, unitAmount: 2999, currency: "eur" },
    ]),
    /do not match/,
  );
});

test("reconciliation rejects amount or currency drift under the same price id", () => {
  for (const charged of [
    { priceId: "price_same", quantity: 3, unitAmount: 3999, currency: "eur" },
    { priceId: "price_same", quantity: 3, unitAmount: 2999, currency: "usd" },
  ]) {
    assert.throws(
      () => reconcileChargedItems(snapshot, [charged]),
      /Charged price facts do not match snapshot/,
    );
  }
});

test("reconciliation rejects conflicting Stripe facts for one paid price", () => {
  assert.throws(
    () => reconcileChargedItems(snapshot, [
      { priceId: "price_same", quantity: 1, unitAmount: 2999, currency: "eur" },
      { priceId: "price_same", quantity: 2, unitAmount: 3999, currency: "eur" },
    ]),
    /conflicting price facts/,
  );
});

test("reconciliation rejects tampered durable snapshot facts", () => {
  assert.throws(
    () => reconcileChargedItems(
      [{ ...snapshot[0], quantity: 0 }],
      [{ priceId: "price_same", quantity: 1, unitAmount: 2999, currency: "eur" }],
    ),
    /invalid item facts/,
  );
});

test("Stripe line parsing preserves a positive integer quantity", () => {
  assert.deepEqual(
    parseStripeChargedLineItem({
      price: { id: "price_1", unit_amount: 2999, currency: "eur" },
      quantity: 2,
    }),
    { priceId: "price_1", quantity: 2, unitAmount: 2999, currency: "eur" },
  );
});

for (const quantity of [null, 0, -1, 1.5]) {
  test(`Stripe line parsing rejects invalid quantity ${String(quantity)}`, () => {
    assert.throws(
      () => parseStripeChargedLineItem({
        price: { id: "price_1", unit_amount: 2999, currency: "eur" },
        quantity,
      }),
      /incomplete_line_item/,
    );
  });
}
