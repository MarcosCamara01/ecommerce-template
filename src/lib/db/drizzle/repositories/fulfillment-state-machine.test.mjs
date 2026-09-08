import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canApplyFulfillmentTransition,
  failureTransitionName,
  failureTransitionValues,
  fulfillmentTransitions,
  isClaimEligible,
  isLeasedProcessingTransitionEligible,
  paymentConfirmationTransitionValues,
} from "./fulfillment-state-machine.ts";

test("durable completion requires a processing lease state", () => {
  assert.equal(canApplyFulfillmentTransition("succeed", "processing"), true);
  assert.equal(canApplyFulfillmentTransition("succeed", "pending"), false);
  assert.equal(canApplyFulfillmentTransition("succeed", "needs_attention"), false);
});

test("operator replay only reopens terminal attention states", () => {
  assert.deepEqual(fulfillmentTransitions.replay, {
    from: ["needs_attention"],
    to: "pending",
  });
});

test("payment confirmation only reopens terminal payment-wait work", () => {
  assert.deepEqual(fulfillmentTransitions.paymentConfirmed, {
    from: ["needs_attention"],
    to: "pending",
  });
  assert.equal(canApplyFulfillmentTransition("paymentConfirmed", "needs_attention"), true);
  assert.equal(canApplyFulfillmentTransition("paymentConfirmed", "pending"), false);
  assert.equal(canApplyFulfillmentTransition("paymentConfirmed", "processing"), false);
  assert.equal(canApplyFulfillmentTransition("paymentConfirmed", "succeeded"), false);
});

test("payment confirmation records durably without stealing an active lease", () => {
  const confirmedAt = new Date("2026-08-14T10:00:00.000Z");
  const values = paymentConfirmationTransitionValues({
    state: "processing",
    lastErrorCode: null,
    existingConfirmedAt: null,
    existingConfirmationEventId: null,
    confirmedAt,
    confirmationEventId: "evt_paid",
  }, confirmedAt);

  assert.deepEqual(values, {
    paymentConfirmedAt: confirmedAt,
    paymentConfirmationEventId: "evt_paid",
  });
});

test("payment-not-final failure requeues when confirmation arrived after claim", () => {
  const now = new Date("2026-08-14T10:00:01.000Z");
  const values = failureTransitionValues({
    code: "payment_not_final",
    detail: "Stripe retrieval was stale",
    retryAt: null,
    paymentConfirmedAt: new Date("2026-08-14T10:00:00.000Z"),
    claimStartedAt: new Date("2026-08-14T09:59:59.000Z"),
  }, now);

  assert.equal(values.state, "pending");
  assert.equal(values.nextAttemptAt, now);
  assert.equal(values.leaseOwner, null);
  assert.equal(values.leaseExpiresAt, null);
  assert.equal(values.lastErrorCode, null);
  assert.equal(values.lastErrorDetail, null);
});

test("confirmation predating the claim cannot bypass the retry ceiling", () => {
  const values = failureTransitionValues({
    code: "payment_not_final",
    detail: "Stripe retrieval remains stale",
    retryAt: null,
    paymentConfirmedAt: new Date("2026-08-14T10:00:00.000Z"),
    claimStartedAt: new Date("2026-08-14T10:00:01.000Z"),
  });
  assert.equal(values.state, "needs_attention");
  assert.equal(values.lastErrorCode, "payment_not_final");
});

test("a duplicate confirmation cannot reopen terminal payment wait", () => {
  const confirmedAt = new Date("2026-08-14T10:00:00.000Z");
  const values = paymentConfirmationTransitionValues({
    state: "needs_attention",
    lastErrorCode: "payment_not_final",
    existingConfirmedAt: confirmedAt,
    existingConfirmationEventId: "evt_paid",
    confirmedAt,
    confirmationEventId: "evt_paid",
  }, new Date("2026-08-14T10:05:00.000Z"));
  assert.equal("state" in values, false);
  assert.equal(values.paymentConfirmationEventId, "evt_paid");
});

test("confirmation and claim ordering uses one database clock", async () => {
  const source = await readFile(
    new URL("./fulfillment.repository.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /select clock_timestamp\(\) as "receivedAt"/);
  assert.match(source, /paymentConfirmedAt = new Date\(databaseClock\.receivedAt\)/);
  assert.doesNotMatch(source, /paymentConfirmedAt = new Date\(\)/);
});

test("a durable payment signal never masks unrelated terminal failures", () => {
  const values = failureTransitionValues({
    code: "stripe_evidence_mismatch",
    detail: "Charged lines differ",
    retryAt: null,
    paymentConfirmedAt: new Date("2026-08-14T10:00:00.000Z"),
  });

  assert.equal(values.state, "needs_attention");
  assert.equal(values.lastErrorCode, "stripe_evidence_mismatch");
});

test("failure outcome selects retry or operator attention centrally", () => {
  assert.equal(failureTransitionName(new Date()), "retry");
  assert.equal(failureTransitionName(null), "requireAttention");
});

test("claim accepts pending and stale processing work but rejects terminal work", () => {
  assert.equal(canApplyFulfillmentTransition("claim", "pending"), true);
  assert.equal(canApplyFulfillmentTransition("claim", "processing"), true);
  assert.equal(canApplyFulfillmentTransition("claim", "succeeded"), false);
  assert.equal(canApplyFulfillmentTransition("claim", "needs_attention"), false);
});

test("claim eligibility covers due time and lease expiry", () => {
  const now = new Date("2026-08-14T10:00:00.000Z");
  const due = new Date("2026-08-14T09:59:00.000Z");
  const future = new Date("2026-08-14T10:01:00.000Z");
  const staleLease = new Date("2026-08-14T09:59:59.000Z");
  const activeLease = new Date("2026-08-14T10:00:01.000Z");

  assert.equal(isClaimEligible({ state: "pending", nextAttemptAt: due, leaseExpiresAt: null }, now), true);
  assert.equal(isClaimEligible({ state: "processing", nextAttemptAt: due, leaseExpiresAt: staleLease }, now), true);
  assert.equal(isClaimEligible({ state: "processing", nextAttemptAt: due, leaseExpiresAt: activeLease }, now), false);
  assert.equal(isClaimEligible({ state: "pending", nextAttemptAt: future, leaseExpiresAt: null }, now), false);
  assert.equal(isClaimEligible({ state: "succeeded", nextAttemptAt: due, leaseExpiresAt: null }, now), false);
});

test("completion and failure require a matching unexpired processing lease", () => {
  const now = new Date("2026-08-14T10:00:00.000Z");
  const activeLease = new Date("2026-08-14T10:00:01.000Z");
  const expiredLease = new Date("2026-08-14T09:59:59.000Z");
  const eligible = (overrides = {}) => isLeasedProcessingTransitionEligible({
    state: "processing",
    leaseOwner: "worker-1",
    leaseExpiresAt: activeLease,
    workerId: "worker-1",
    ...overrides,
  }, now);

  assert.equal(eligible(), true);
  assert.equal(eligible({ state: "pending" }), false);
  assert.equal(eligible({ leaseOwner: "worker-2" }), false);
  assert.equal(eligible({ leaseExpiresAt: expiredLease }), false);
  assert.equal(eligible({ leaseExpiresAt: now }), false);
  assert.equal(eligible({ leaseExpiresAt: null }), false);
});
