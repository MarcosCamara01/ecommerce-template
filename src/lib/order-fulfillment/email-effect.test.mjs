import assert from "node:assert/strict";
import test from "node:test";

import {
  executeOrderEmailEffect,
  orderEmailDeliveryFromIdempotencyKey,
} from "./email-effect.ts";

test("a sibling failure never re-runs an already completed delivery", async () => {
  const effects = [
    { id: 1, idempotencyKey: "work:7:email:customer", state: "pending" },
    { id: 2, idempotencyKey: "work:7:email:owner", state: "pending" },
  ];
  const sends = { customer: 0, owner: 0 };
  let failOwnerOnce = true;

  async function runPending() {
    for (const effect of effects.filter((candidate) => candidate.state === "pending")) {
      const delivery = orderEmailDeliveryFromIdempotencyKey(effect.idempotencyKey);
      assert.ok(delivery);
      effect.state = "processing";
      try {
        await executeOrderEmailEffect(effect, delivery, {
          send: async (target) => {
            sends[target] += 1;
            if (target === "owner" && failOwnerOnce) {
              failOwnerOnce = false;
              throw new Error("SMTP owner delivery failed");
            }
          },
          complete: async (effectId) => {
            assert.equal(effectId, effect.id);
            effect.state = "succeeded";
          },
        });
      } catch {
        effect.state = "pending";
      }
    }
  }

  await runPending();
  assert.deepEqual(effects.map((effect) => effect.state), ["succeeded", "pending"]);
  await runPending();

  assert.deepEqual(effects.map((effect) => effect.state), ["succeeded", "succeeded"]);
  assert.deepEqual(sends, { customer: 1, owner: 2 });
});
