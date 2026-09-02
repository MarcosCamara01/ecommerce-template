import assert from "node:assert/strict";
import test from "node:test";

import { orderStatusPresentation } from "./status.ts";

test("a newly fulfilled order is confirmed, not in transit", () => {
  assert.deepEqual(orderStatusPresentation("confirmed"), {
    label: "Confirmed",
    progress: "w-1/4",
    className: "bg-color-secondary/20 text-color-secondary",
  });
});

test("shipment labels follow durable state instead of delivery estimates", () => {
  assert.equal(orderStatusPresentation("processing").label, "Processing");
  assert.equal(orderStatusPresentation("shipped").label, "Shipped");
  assert.equal(orderStatusPresentation("delivered").label, "Delivered");
  assert.equal(orderStatusPresentation("cancelled").label, "Cancelled");
});
