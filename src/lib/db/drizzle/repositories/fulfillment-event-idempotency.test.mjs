import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

import ts from "typescript";
import * as fulfillmentStateMachine from "./fulfillment-state-machine.ts";

const nativeRequire = createRequire(import.meta.url);
const source = await readFile(
  new URL("./fulfillment.repository.ts", import.meta.url),
  "utf8",
);

test("a new receipt preserves the successful async-payment event path", async () => {
  const harness = loadRepositoryHarness();
  const result = await harness.repository.registerEvent(asyncPaymentEvent());

  assert.equal(result, undefined);
  assert.equal(harness.state.receiptIds.has("evt_verified"), true);
  assert.equal(harness.state.workInsertions, 1);
  assert.equal(harness.state.workMutations, 0);
  assert.equal(harness.state.work.state, "pending");
  assert.equal(harness.state.work.leaseOwner, null);
  assert.equal(harness.state.work.leaseExpiresAt, null);
  assert.equal(
    harness.state.work.paymentConfirmationEventId,
    "evt_verified",
  );
});

test("async payment success only reopens work waiting for payment confirmation", async () => {
  const harness = loadRepositoryHarness({
    work: {
      checkoutSessionId: "cs_verified",
      state: "needs_attention",
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: "payment_not_final",
      lastErrorDetail: "Payment was still pending",
    },
  });

  await harness.repository.registerEvent(asyncPaymentEvent());

  assert.equal(harness.state.workMutations, 1);
  assert.equal(harness.state.work.state, "pending");
  assert.equal(
    harness.state.work.paymentConfirmationEventId,
    "evt_verified",
  );
  assert.equal(harness.state.work.lastErrorCode, null);
  assert.equal(harness.state.work.lastErrorDetail, null);
});

test("async payment success records its signal without reopening permanent failures", async () => {
  const harness = loadRepositoryHarness({
    work: {
      checkoutSessionId: "cs_verified",
      state: "needs_attention",
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: "historical_catalog_identity_missing",
      lastErrorDetail: "Variant identity is missing",
    },
  });
  await harness.repository.registerEvent(asyncPaymentEvent());

  assert.equal(harness.state.workMutations, 1);
  assert.equal(harness.state.work.state, "needs_attention");
  assert.equal(
    harness.state.work.lastErrorCode,
    "historical_catalog_identity_missing",
  );
  assert.equal(harness.state.work.paymentConfirmationEventId, "evt_verified");
});

test("a duplicate receipt repairs a missing signal without revoking an active lease", async () => {
  const protectedStates = [
    {
      state: "needs_attention",
      leaseOwner: null,
      leaseExpiresAt: null,
    },
    {
      state: "processing",
      leaseOwner: "worker-1",
      leaseExpiresAt: new Date("2026-08-14T12:01:00.000Z"),
    },
  ];

  for (const protectedWork of protectedStates) {
    const harness = loadRepositoryHarness({
      receiptIds: ["evt_verified"],
      work: protectedWork,
    });
    const stateBefore = harness.state.work.state;
    const ownerBefore = harness.state.work.leaseOwner;
    const expiryBefore = harness.state.work.leaseExpiresAt;

    const result = await harness.repository.registerEvent(asyncPaymentEvent());

    assert.equal(result, undefined);
    assert.equal(harness.state.work.state, stateBefore);
    assert.equal(harness.state.work.leaseOwner, ownerBefore);
    assert.deepEqual(harness.state.work.leaseExpiresAt, expiryBefore);
    assert.equal(harness.state.work.paymentConfirmationEventId, "evt_verified");
    assert.equal(harness.state.workInsertions, 0);
    assert.equal(harness.state.workMutations, 1);
  }
});

test("payment confirmation committed before failWork prevents terminal payment wait", async () => {
  const harness = loadRepositoryHarness({
    work: processingWork(),
  });

  await harness.repository.registerEvent(asyncPaymentEvent());
  assert.equal(harness.state.work.state, "processing");
  assert.equal(harness.state.work.leaseOwner, "worker-1");

  await harness.repository.failWork({
    workId: 1,
    workerId: "worker-1",
    code: "payment_not_final",
    detail: "retrieval completed before the event",
    retryAt: null,
  });

  assert.equal(harness.state.work.state, "pending");
  assert.equal(harness.state.work.lastErrorCode, null);
  assert.equal(harness.state.work.paymentConfirmationEventId, "evt_verified");
});

test("payment confirmation committed after failWork reopens only payment wait", async () => {
  const harness = loadRepositoryHarness({
    work: processingWork(),
  });

  await harness.repository.failWork({
    workId: 1,
    workerId: "worker-1",
    code: "payment_not_final",
    detail: "payment was still pending",
    retryAt: null,
  });
  assert.equal(harness.state.work.state, "needs_attention");

  await harness.repository.registerEvent(asyncPaymentEvent());

  assert.equal(harness.state.work.state, "pending");
  assert.equal(harness.state.work.lastErrorCode, null);
  assert.equal(harness.state.work.paymentConfirmationEventId, "evt_verified");
});

test("duplicate async confirmation cannot reopen exhausted payment wait", async () => {
  const event = asyncPaymentEvent();
  const harness = loadRepositoryHarness({
    receiptIds: [event.id],
    work: {
      id: 1,
      checkoutSessionId: "cs_verified",
      state: "needs_attention",
      leaseOwner: null,
      leaseExpiresAt: null,
      lastErrorCode: "payment_not_final",
      lastErrorDetail: "retry budget exhausted",
      paymentConfirmedAt: new Date(event.created * 1000),
      paymentConfirmationEventId: event.id,
    },
  });
  await harness.repository.registerEvent(event);
  assert.equal(harness.state.work.state, "needs_attention");
  assert.equal(harness.state.work.lastErrorCode, "payment_not_final");
});

test("a delayed async confirmation received during the final claim requeues", async () => {
  const harness = loadRepositoryHarness({
    work: { ...processingWork(), attemptCount: 8 },
  });
  const delayed = {
    ...asyncPaymentEvent(),
    id: "evt_delayed_verified",
    created: 1,
  };
  await harness.repository.registerEvent(delayed);
  await harness.repository.failWork({
    workId: 1,
    workerId: "worker-1",
    code: "payment_not_final",
    detail: "Stripe read completed before delayed delivery",
    retryAt: null,
  });
  assert.equal(harness.state.work.state, "pending");
  assert.equal(harness.state.work.lastErrorCode, null);
});

function processingWork() {
  return {
    id: 1,
    checkoutSessionId: "cs_verified",
    state: "processing",
    attemptCount: 1,
    nextAttemptAt: new Date("2026-08-14T11:59:00.000Z"),
    leaseOwner: "worker-1",
    leaseExpiresAt: new Date("2099-08-14T12:01:00.000Z"),
    lastErrorCode: null,
    lastErrorDetail: null,
    paymentConfirmedAt: null,
    paymentConfirmationEventId: null,
    updatedAt: new Date(0),
  };
}

function asyncPaymentEvent() {
  return {
    id: "evt_verified",
    type: "checkout.session.async_payment_succeeded",
    created: 1_786_704_000,
    data: { object: { id: "cs_verified" } },
  };
}

function loadRepositoryHarness(options = {}) {
  const stripeEventReceipts = { eventId: "stripeEventReceipts.eventId" };
  const fulfillmentWork = {
    id: "fulfillmentWork.id",
    checkoutSessionId: "fulfillmentWork.checkoutSessionId",
    state: "fulfillmentWork.state",
    lastErrorCode: "fulfillmentWork.lastErrorCode",
  };
  const fulfillmentEffects = {};
  const fulfillmentReplayAudit = {};
  const state = {
    receiptIds: new Set(options.receiptIds ?? []),
    work: options.work ? {
      id: 1,
      checkoutSessionId: "cs_verified",
      paymentConfirmedAt: null,
      paymentConfirmationEventId: null,
      ...structuredClone(options.work),
    } : null,
    workInsertions: 0,
    workMutations: 0,
  };

  const tx = {
    execute: async () => [{
      receivedAt: options.databaseNow ?? new Date("2026-08-18T10:00:00.000Z"),
    }],
    insert(table) {
      return {
        values(value) {
          return {
            onConflictDoNothing() {
              let operation;
              const run = () => {
                operation ??= Promise.resolve().then(() => {
                  if (table === stripeEventReceipts) {
                    if (state.receiptIds.has(value.eventId)) return [];
                    state.receiptIds.add(value.eventId);
                    return [{ eventId: value.eventId }];
                  }
                  if (table === fulfillmentWork) {
                    if (state.work) return [];
                    state.workInsertions += 1;
                    state.work = {
                      id: 1,
                      checkoutSessionId: value.checkoutSessionId,
                      sourceEventId: value.sourceEventId ?? null,
                      state: "pending",
                      leaseOwner: null,
                      leaseExpiresAt: null,
                      lastErrorCode: null,
                      lastErrorDetail: null,
                      paymentConfirmedAt: value.paymentConfirmedAt ?? null,
                      paymentConfirmationEventId:
                        value.paymentConfirmationEventId ?? null,
                    };
                    return [{ id: state.work.id }];
                  }
                  return [];
                });
                return operation;
              };
              return {
                returning: () => run(),
                then: (onFulfilled, onRejected) => run().then(onFulfilled, onRejected),
              };
            },
          };
        },
      };
    },
    update(table) {
      return {
        set(values) {
          return {
            where: (predicate) => {
              const execute = async () => {
                if (
                  table === fulfillmentWork &&
                  state.work &&
                  matchesPredicate(predicate, state.work, fulfillmentWork)
                ) {
                  state.workMutations += 1;
                  Object.assign(state.work, values);
                  return [{ id: state.work.id }];
                }
                return [];
              };
              return {
                returning: () => execute(),
                then: (onFulfilled, onRejected) =>
                  execute().then(onFulfilled, onRejected),
              };
            },
          };
        },
      };
    },
    select() {
      return {
        from(table) {
          return {
            where(predicate) {
              return {
                for: async () =>
                  table === fulfillmentWork &&
                    state.work &&
                    matchesPredicate(predicate, state.work, fulfillmentWork)
                    ? [state.work]
                    : [],
              };
            },
          };
        },
      };
    },
  };
  const db = { transaction: async (operation) => operation(tx) };
  const modules = {
    "server-only": {},
    "drizzle-orm": {
      and: (...values) => ({ type: "and", values }),
      eq: (left, right) => ({ type: "eq", left, right }),
      sql: Object.assign(() => ({}), { raw: (value) => value, join: () => ({}) }),
    },
    "@/lib/db/drizzle/connection": { db },
    "../connection": { db },
    "../schema": {
      fulfillmentEffects,
      fulfillmentReplayAudit,
      fulfillmentWork,
      stripeEventReceipts,
    },
    "./orders.repository": {
      createCompleteOrderInTransaction: async () => 1,
      ordersRepository: {},
    },
    "./cart.repository": { consumePurchasedInTransaction: async () => undefined },
    "./fulfillment-email-effects": { buildOrderEmailEffects: () => [] },
    "@/lib/order-fulfillment/lease-race": {
      FulfillmentLeaseLostError: class FulfillmentLeaseLostError extends Error {},
    },
    "./fulfillment-state-machine": {
      ...fulfillmentStateMachine,
      claimEligibilityPredicate: () => ({}),
      claimTransitionMutation: () => ({}),
      fulfillmentTransitions: fulfillmentStateMachine.fulfillmentTransitions,
      leasedProcessingPredicate: (input) => ({ type: "leased", input }),
      transitionSourcePredicate: (column, transition) => ({
        type: "transition",
        column,
        transition,
      }),
    },
    "./fulfillment-replay": { replayTerminalWithAudit: async () => false },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "fulfillment.repository.ts",
  }).outputText;
  const repositoryModule = { exports: {} };
  const mockedRequire = (id) => modules[id] ?? nativeRequire(id);
  new Function("require", "module", "exports", compiled)(
    mockedRequire,
    repositoryModule,
    repositoryModule.exports,
  );

  return {
    repository: repositoryModule.exports.fulfillmentRepository,
    state,
  };
}

function matchesPredicate(predicate, work, columns) {
  if (predicate?.type === "and") {
    return predicate.values.every((value) => matchesPredicate(value, work, columns));
  }
  if (predicate?.type === "eq") {
    const values = new Map([
      [columns.id, work.id],
      [columns.checkoutSessionId, work.checkoutSessionId],
      [columns.state, work.state],
      [columns.lastErrorCode, work.lastErrorCode],
    ]);
    return values.get(predicate.left) === predicate.right;
  }
  if (predicate?.type === "leased") {
    return work.id === predicate.input.id &&
      work.state === "processing" &&
      work.leaseOwner === predicate.input.workerId &&
      work.leaseExpiresAt instanceof Date &&
      work.leaseExpiresAt.getTime() > Date.now();
  }
  if (predicate?.type === "transition") {
    return predicate.transition === "paymentConfirmed" && work.state === "needs_attention";
  }
  return true;
}
