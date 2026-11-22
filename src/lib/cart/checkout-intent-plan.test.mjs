import assert from "node:assert/strict";
import test from "node:test";

import { planCheckoutIntent } from "./checkout-intent-plan.ts";

const line = (cartItemId, overrides = {}) => ({
  cartItemId,
  variantId: cartItemId + 100,
  size: "M",
  quantity: 1,
  priceId: `price_${cartItemId}`,
  unitAmount: 1000,
  currency: "eur",
  ...overrides,
});

const intent = (id, items, { session = `cs_${id}`, reusable = true } = {}) => ({
  id,
  checkoutSessionId: session,
  items,
  reusable,
});

test("an open intent for the same lines is reused whatever their order", () => {
  const existing = intent("a", [line(1), line(2)]);
  const plan = planCheckoutIntent([existing], [line(2), line(1)], new Set());
  assert.equal(plan.reuse, existing);
  assert.deepEqual(plan.supersededSessionIds, []);
});

test("an unbound intent for the same lines is reused so its session is created once", () => {
  const pending = intent("a", [line(1)], { session: null });
  const plan = planCheckoutIntent([pending], [line(1)], new Set());
  assert.equal(plan.reuse, pending);
});

test("a changed quantity starts a new intent and supersedes the old session", () => {
  const plan = planCheckoutIntent(
    [intent("a", [line(1)])],
    [line(1, { quantity: 2 })],
    new Set(),
  );
  assert.equal(plan.reuse, null);
  assert.deepEqual(plan.supersededSessionIds, ["cs_a"]);
});

test("a changed price never reuses the old session", () => {
  const plan = planCheckoutIntent(
    [intent("a", [line(1)])],
    [line(1, { unitAmount: 900, priceId: "price_cheaper" })],
    new Set(),
  );
  assert.equal(plan.reuse, null);
  assert.deepEqual(plan.supersededSessionIds, ["cs_a"]);
});

test("a wider selection supersedes every open session sharing one of its lines", () => {
  const plan = planCheckoutIntent(
    [intent("a", [line(1)]), intent("b", [line(2), line(3)]), intent("c", [line(4)])],
    [line(1), line(2)],
    new Set(),
  );
  assert.equal(plan.reuse, null);
  assert.deepEqual(plan.supersededSessionIds, ["cs_a", "cs_b"]);
});

test("an identical intent close to expiry is superseded instead of reused", () => {
  const plan = planCheckoutIntent(
    [intent("a", [line(1)], { reusable: false })],
    [line(1)],
    new Set(),
  );
  assert.equal(plan.reuse, null);
  assert.deepEqual(plan.supersededSessionIds, ["cs_a"]);
});

test("the newest matching intent wins and older duplicates are superseded", () => {
  const newest = intent("new", [line(1)]);
  const plan = planCheckoutIntent(
    [newest, intent("old", [line(1)])],
    [line(1)],
    new Set(),
  );
  assert.equal(plan.reuse, newest);
  assert.deepEqual(plan.supersededSessionIds, ["cs_old"]);
});

test("stale intents are neither reused nor expired again", () => {
  const plan = planCheckoutIntent(
    [intent("a", [line(1)])],
    [line(1)],
    new Set(["a"]),
  );
  assert.equal(plan.reuse, null);
  assert.deepEqual(plan.supersededSessionIds, []);
});

test("an unbound overlapping intent has no session to expire", () => {
  const plan = planCheckoutIntent(
    [intent("a", [line(1)], { session: null })],
    [line(1), line(2)],
    new Set(),
  );
  assert.deepEqual(plan.supersededSessionIds, []);
});
