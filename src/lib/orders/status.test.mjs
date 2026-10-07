import assert from "node:assert/strict";
import test from "node:test";

import { orderStatusPresentation } from "./status.ts";

test("a newly fulfilled order is confirmed, not in transit", () => {
  assert.deepEqual(orderStatusPresentation("confirmed"), {
    label: "Confirmed",
    step: 1,
    className: "border border-fg bg-fg text-bg",
  });
});

test("shipment labels follow durable state instead of delivery estimates", () => {
  assert.equal(orderStatusPresentation("processing").label, "Processing");
  assert.equal(orderStatusPresentation("shipped").label, "Shipped");
  assert.equal(orderStatusPresentation("delivered").label, "Delivered");
  assert.equal(orderStatusPresentation("cancelled").label, "Canceled");
});

test("progress steps follow the order lifecycle and settle when finished", () => {
  assert.equal(orderStatusPresentation("shipped").step, 3);
  assert.equal(orderStatusPresentation("delivered").step, 4);
  assert.equal(orderStatusPresentation("cancelled").step, 0);
  assert.equal(
    orderStatusPresentation("delivered").className,
    "border border-fg text-fg",
  );
});
