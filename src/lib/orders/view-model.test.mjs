import assert from "node:assert/strict";
import test from "node:test";

import { orderViewModel } from "./view-model.ts";

test("order consumers share one totals and dates projection", () => {
  const view = orderViewModel({
    status: "confirmed",
    deliveryDate: "2026-08-26T00:00:00.000Z",
    createdAt: "2026-08-19T00:00:00.000Z",
    customerInfo: { totalPrice: 4995 },
    orderProducts: [{ quantity: 2 }, { quantity: 1 }],
  });
  assert.equal(view.totalItems, 3);
  assert.match(view.totalPrice, /49/);
  assert.equal(view.deliveryDate.toISOString(), "2026-08-26T00:00:00.000Z");
  assert.equal(view.orderDate.toISOString(), "2026-08-19T00:00:00.000Z");
  assert.equal(view.status.label, "Confirmed");
});
