import assert from "node:assert/strict";
import test from "node:test";

import { buildOrderEmailEffects } from "./fulfillment-email-effects.ts";

test("one work creates one independently durable effect per email delivery", () => {
  assert.deepEqual(buildOrderEmailEffects(7), [
    {
      workId: 7,
      kind: "order_email",
      idempotencyKey: "work:7:email:customer",
    },
    {
      workId: 7,
      kind: "order_email",
      idempotencyKey: "work:7:email:owner",
    },
  ]);
});
