import assert from "node:assert/strict";
import test from "node:test";

import {
  checkoutStatusCopy,
  customerEmailMessage,
} from "./checkout-copy.ts";

test("paid checkout copy distinguishes fulfillment from order confirmation", () => {
  assert.deepEqual(checkoutStatusCopy("fulfillment_pending"), {
    title: "Payment Received",
    message:
      "Your payment is confirmed. We’re preparing your order now, and this page will update automatically.",
  });
  assert.deepEqual(checkoutStatusCopy("needs_attention"), {
    title: "Payment Received",
    message:
      "Your payment is safe, but your order needs review. No purchase information has been lost.",
  });
});

test("customer email copy reflects the durable delivery effect", () => {
  assert.equal(
    customerEmailMessage("queued"),
    "Your confirmation email is queued and will be sent shortly.",
  );
  assert.equal(
    customerEmailMessage("delayed"),
    "Email delivery is delayed, but your order is confirmed and safe.",
  );
  assert.equal(
    customerEmailMessage("sent"),
    "A confirmation email has been sent with your order details and receipt.",
  );
});
