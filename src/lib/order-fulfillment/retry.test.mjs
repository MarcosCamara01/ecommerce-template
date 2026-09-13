import assert from "node:assert/strict";
import test from "node:test";

import { FulfillmentFailure, classifyFulfillmentError, retryAt } from "./retry.ts";
import {
  assertReferencedVariantsExist,
  reconcileChargedItems,
} from "./checkout-snapshot.ts";
import { ExistingOrderMismatchError } from "../orders/existing-order-idempotency.ts";

test("typed permanent failures never retry", () => {
  const result = classifyFulfillmentError(
    new FulfillmentFailure("catalog_mismatch", false, "catalog mismatch"),
  );
  assert.equal(result.retryable, false);
  assert.equal(retryAt(1, result.retryable), null);
});

test("an existing order mismatch requires operator attention immediately", () => {
  const result = classifyFulfillmentError(new ExistingOrderMismatchError());

  assert.equal(result.code, "existing_order_mismatch");
  assert.equal(result.retryable, false);
  assert.equal(retryAt(1, result.retryable), null);
});

for (const [expectedCode, operation] of [
  [
    "durable_snapshot_corrupt",
    () => reconcileChargedItems(
      [{ cartItemId: 1, variantId: 2, size: "M", quantity: 0, priceId: "price_1" }],
      [{ priceId: "price_1", quantity: 1, unitAmount: 1000, currency: "eur" }],
    ),
  ],
  [
    "stripe_evidence_mismatch",
    () => reconcileChargedItems(
      [{ cartItemId: 1, variantId: 2, size: "M", quantity: 1, priceId: "price_1", unitAmount: 1000, currency: "eur" }],
      [{ priceId: "price_2", quantity: 1, unitAmount: 1000, currency: "eur" }],
    ),
  ],
  [
    "historical_catalog_identity_missing",
    () => assertReferencedVariantsExist([{ variantId: 2 }], []),
  ],
]) {
  test(`${expectedCode} goes directly to needs_attention`, () => {
    let captured;
    try {
      operation();
    } catch (error) {
      captured = error;
    }
    const result = classifyFulfillmentError(captured);
    assert.equal(result.code, expectedCode);
    assert.equal(result.retryable, false);
    assert.equal(retryAt(1, result.retryable), null);
  });
}

test("Postgres serialization failures retry without message matching", () => {
  const result = classifyFulfillmentError({ code: "40001", message: "localized" });
  assert.equal(result.retryable, true);
  assert.match(result.code, /40001/);
});

test("retry budget has a hard terminal bound", () => {
  assert.equal(retryAt(8, true), null);
});

for (const type of [
  "StripeAPIError",
  "StripeConnectionError",
  "StripeRateLimitError",
]) {
  test(`${type} retries even when Stripe provides no HTTP status`, () => {
    const result = classifyFulfillmentError({ type, message: "temporary" });
    assert.equal(result.retryable, true);
    assert.equal(result.code, type);
  });
}

test("typed permanent Stripe failures remain terminal", () => {
  const result = classifyFulfillmentError({
    type: "StripeInvalidRequestError",
    statusCode: 400,
    message: "invalid request",
  });
  assert.equal(result.retryable, false);
});
