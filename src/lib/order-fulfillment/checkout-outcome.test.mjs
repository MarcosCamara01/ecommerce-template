import assert from "node:assert/strict";
import test from "node:test";

import { checkoutOutcomeFromRecord } from "./checkout-outcome.ts";

test("paid checkout remains pending until durable fulfillment succeeds", () => {
  for (const workState of [null, "pending", "processing"]) {
    assert.deepEqual(
      checkoutOutcomeFromRecord({
        workState,
        orderId: null,
        customerEmailState: null,
        customerEmailLastErrorCode: null,
        cartCleanupState: null,
      }),
      { status: "fulfillment_pending" },
    );
  }
});

test("operator attention remains distinct from a confirmed order", () => {
  assert.deepEqual(
    checkoutOutcomeFromRecord({
      workState: "needs_attention",
      orderId: null,
      customerEmailState: null,
      customerEmailLastErrorCode: null,
      cartCleanupState: null,
    }),
    { status: "needs_attention" },
  );
});

test("fulfilled checkout reports the durable customer email outcome", () => {
  const cases = [
    [null, null, "queued"],
    ["pending", null, "queued"],
    ["processing", null, "queued"],
    ["pending", "smtp_unavailable", "delayed"],
    ["needs_attention", "smtp_rejected", "delayed"],
    ["succeeded", null, "sent"],
  ];

  for (const [customerEmailState, customerEmailLastErrorCode, expected] of cases) {
    assert.deepEqual(
      checkoutOutcomeFromRecord({
        workState: "succeeded",
        orderId: 42,
        customerEmailState,
        customerEmailLastErrorCode,
        cartCleanupState: "succeeded",
      }),
      {
        status: "fulfilled",
        orderId: 42,
        customerEmail: expected,
        cartCleanup: "succeeded",
      },
    );
  }
});

test("fulfilled checkout keeps polling until cart cleanup settles", () => {
  const cases = [
    [null, "pending"],
    ["pending", "pending"],
    ["processing", "pending"],
    ["needs_attention", "delayed"],
    ["succeeded", "succeeded"],
  ];

  for (const [cartCleanupState, expected] of cases) {
    assert.deepEqual(
      checkoutOutcomeFromRecord({
        workState: "succeeded",
        orderId: 42,
        customerEmailState: "succeeded",
        customerEmailLastErrorCode: null,
        cartCleanupState,
      }),
      {
        status: "fulfilled",
        orderId: 42,
        customerEmail: "sent",
        cartCleanup: expected,
      },
    );
  }
});

test("succeeded work without an order fails as an invariant violation", () => {
  assert.throws(
    () => checkoutOutcomeFromRecord({
      workState: "succeeded",
      orderId: null,
      customerEmailState: null,
      customerEmailLastErrorCode: null,
      cartCleanupState: null,
    }),
    /succeeded without a durable order/,
  );
});
