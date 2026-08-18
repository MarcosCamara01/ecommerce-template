import "server-only";

import { and, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "../connection";
import {
  fulfillmentEffects,
  fulfillmentReplayAudit,
  fulfillmentWork,
  stripeEventReceipts,
  type FulfillmentEffectRow,
  type FulfillmentWorkRow,
} from "../schema";
import {
  createCompleteOrderInTransaction,
  ordersRepository,
  type CompleteOrderInput,
} from "./orders.repository";
import { consumePurchasedInTransaction } from "./cart.repository";
import { buildOrderEmailEffects } from "./fulfillment-email-effects";
import {
  failureTransitionValues,
  fulfillmentTransitions,
  claimTransitionMutation,
  claimEligibilityPredicate,
  leasedProcessingPredicate,
  paymentConfirmationTransitionValues,
  releasedTransitionValues,
  replayTransitionValues,
  transitionSourcePredicate,
} from "./fulfillment-state-machine";
import { replayTerminalWithAudit } from "./fulfillment-replay";
import { FulfillmentLeaseLostError } from "@/lib/order-fulfillment/lease-race";

export type ClaimedEffect = FulfillmentEffectRow & {
  orderId: number;
  checkoutSessionId: string;
  checkoutIntentId: string;
};

type FailureTransition = {
  workerId: string;
  code: string;
  detail: string;
  retryAt: Date | null;
};

export const fulfillmentRepository = {
  async registerEvent(event: Stripe.Event): Promise<void> {
    await db.transaction(async (tx) => {
      const [databaseClock] = await tx.execute<{ receivedAt: Date | string }>(sql`
        select clock_timestamp() as "receivedAt"
      `);
      const paymentConfirmedAt = new Date(databaseClock.receivedAt);
      if (Number.isNaN(paymentConfirmedAt.getTime())) {
        throw new Error("PostgreSQL returned an invalid confirmation timestamp");
      }
      const [insertedReceipt] = await tx
        .insert(stripeEventReceipts)
        .values({
          eventId: event.id,
          eventType: event.type,
          objectId: "id" in event.data.object ? event.data.object.id : null,
          stripeCreatedAt: new Date(event.created * 1000),
          receivedAt: paymentConfirmedAt,
          payload: JSON.parse(JSON.stringify(event)) as Record<string, unknown>,
        })
        .onConflictDoNothing({ target: stripeEventReceipts.eventId })
        .returning({ eventId: stripeEventReceipts.eventId });

      if (
        event.type !== "checkout.session.completed" &&
        event.type !== "checkout.session.async_payment_succeeded"
      ) return;
      if (!insertedReceipt && event.type !== "checkout.session.async_payment_succeeded") {
        return;
      }
      const session = event.data.object as Stripe.Checkout.Session;
      const insertedWork = await tx
        .insert(fulfillmentWork)
        .values({
          checkoutSessionId: session.id,
          sourceEventId: event.id,
          ...(event.type === "checkout.session.async_payment_succeeded"
            ? {
                paymentConfirmedAt,
                paymentConfirmationEventId: event.id,
              }
            : {}),
        })
        .onConflictDoNothing({ target: fulfillmentWork.checkoutSessionId })
        .returning({ id: fulfillmentWork.id });
      if (
        event.type === "checkout.session.async_payment_succeeded" &&
        insertedWork.length === 0
      ) {
        const [work] = await tx
          .select()
          .from(fulfillmentWork)
          .where(eq(fulfillmentWork.checkoutSessionId, session.id))
          .for("update");
        if (!work) throw new Error("Payment confirmation work row is missing");
        await tx
          .update(fulfillmentWork)
          .set(paymentConfirmationTransitionValues({
            state: work.state,
            lastErrorCode: work.lastErrorCode,
            existingConfirmedAt: work.paymentConfirmedAt,
            existingConfirmationEventId: work.paymentConfirmationEventId,
            confirmedAt: paymentConfirmedAt,
            confirmationEventId: event.id,
          }))
          .where(eq(fulfillmentWork.id, work.id));
      }
    });
  },

  async ensureWork(checkoutSessionId: string): Promise<void> {
    await db
      .insert(fulfillmentWork)
      .values({ checkoutSessionId })
      .onConflictDoNothing({ target: fulfillmentWork.checkoutSessionId });
  },

  async replayWork(
    input: {
      checkoutSessionId: string;
      operatorUserId: string;
      reason: string;
    },
  ): Promise<boolean> {
    return replayTerminalWithAudit(
      (operation) => db.transaction((tx) => operation({
        lockTarget: async () => {
          const [target] = await tx
            .select({ id: fulfillmentWork.id, state: fulfillmentWork.state })
            .from(fulfillmentWork)
            .where(
              and(
                eq(fulfillmentWork.checkoutSessionId, input.checkoutSessionId),
                transitionSourcePredicate(fulfillmentWork.state, "replay"),
              ),
            )
            .for("update");
          return target
            ? { id: target.id, priorState: target.state }
            : null;
        },
        transitionTarget: async (id) => {
          const rows = await tx
            .update(fulfillmentWork)
            .set(replayTransitionValues())
            .where(
              and(
                eq(fulfillmentWork.id, id),
                transitionSourcePredicate(fulfillmentWork.state, "replay"),
              ),
            )
            .returning({ id: fulfillmentWork.id });
          return rows.length === 1;
        },
        appendAudit: async (audit) => {
          await tx.insert(fulfillmentReplayAudit).values(audit);
        },
      })),
      {
        targetKind: "work",
        targetId: input.checkoutSessionId,
        operatorUserId: input.operatorUserId,
        reason: input.reason,
      },
    );
  },

  async replayEffect(
    input: { effectId: number; operatorUserId: string; reason: string },
  ): Promise<boolean> {
    return replayTerminalWithAudit(
      (operation) => db.transaction((tx) => operation({
        lockTarget: async () => {
          const [target] = await tx
            .select({ id: fulfillmentEffects.id, state: fulfillmentEffects.state })
            .from(fulfillmentEffects)
            .where(
              and(
                eq(fulfillmentEffects.id, input.effectId),
                transitionSourcePredicate(fulfillmentEffects.state, "replay"),
              ),
            )
            .for("update");
          return target
            ? { id: target.id, priorState: target.state }
            : null;
        },
        transitionTarget: async (id) => {
          const rows = await tx
            .update(fulfillmentEffects)
            .set(replayTransitionValues())
            .where(
              and(
                eq(fulfillmentEffects.id, id),
                transitionSourcePredicate(fulfillmentEffects.state, "replay"),
              ),
            )
            .returning({ id: fulfillmentEffects.id });
          return rows.length === 1;
        },
        appendAudit: async (audit) => {
          await tx.insert(fulfillmentReplayAudit).values(audit);
        },
      })),
      {
        targetKind: "effect",
        targetId: String(input.effectId),
        operatorUserId: input.operatorUserId,
        reason: input.reason,
      },
    );
  },

  async claimWork(
    workerId: string,
    leaseSeconds: number,
  ): Promise<FulfillmentWorkRow | null> {
    const rows = await db.execute<FulfillmentWorkRow>(sql`
      with candidate as (
        select id
        from app_private.fulfillment_work
        where ${claimEligibilityPredicate({
          stateColumn: sql.raw("state"),
          nextAttemptAtColumn: sql.raw("next_attempt_at"),
          leaseExpiresAtColumn: sql.raw("lease_expires_at"),
        })}
        order by next_attempt_at, id
        for update skip locked
        limit 1
      )
      update app_private.fulfillment_work as work
      set ${claimTransitionMutation({
        attemptCountColumn: sql.raw("work.attempt_count"),
        workerId,
        leaseSeconds,
      })}
      from candidate
      where work.id = candidate.id
      returning
        work.id,
        work.checkout_session_id as "checkoutSessionId",
        work.source_event_id as "sourceEventId",
        work.state,
        work.attempt_count as "attemptCount",
        work.next_attempt_at as "nextAttemptAt",
        work.lease_owner as "leaseOwner",
        work.lease_expires_at as "leaseExpiresAt",
        work.last_error_code as "lastErrorCode",
        work.last_error_detail as "lastErrorDetail",
        work.order_id as "orderId",
        work.created_at as "createdAt",
        work.updated_at as "updatedAt"
    `);
    return rows[0] ?? null;
  },

  async completeWork(
    work: FulfillmentWorkRow,
    workerId: string,
    order: CompleteOrderInput,
  ): Promise<number> {
    return db.transaction(async (tx) => {
      const orderId = await createCompleteOrderInTransaction(tx, order);
      const [updated] = await tx
        .update(fulfillmentWork)
        .set({
          ...releasedTransitionValues(fulfillmentTransitions.succeed.to),
          orderId,
        })
        .where(
          leasedProcessingPredicate({
            idColumn: fulfillmentWork.id,
            id: work.id,
            stateColumn: fulfillmentWork.state,
            leaseOwnerColumn: fulfillmentWork.leaseOwner,
            workerId,
          }),
        )
        .returning({ id: fulfillmentWork.id });
      if (!updated) throw new FulfillmentLeaseLostError("Fulfillment lease was lost before commit");

      await tx
        .insert(fulfillmentEffects)
        .values([
          ...buildOrderEmailEffects(work.id),
          {
            workId: work.id,
            kind: "cart_cleanup",
            idempotencyKey: `order:${orderId}:cart-cleanup`,
          },
        ])
        .onConflictDoNothing({ target: fulfillmentEffects.idempotencyKey });
      return orderId;
    });
  },

  async failWork(input: FailureTransition & {
    workId: number;
  }): Promise<void> {
    await db.transaction(async (tx) => {
      const [work] = await tx
        .select()
        .from(fulfillmentWork)
        .where(eq(fulfillmentWork.id, input.workId))
        .for("update");
      if (!work) throw new FulfillmentLeaseLostError("Fulfillment lease was lost before failure transition");
      const rows = await tx
        .update(fulfillmentWork)
        .set(failureTransitionValues({
          ...input,
          paymentConfirmedAt: work.paymentConfirmedAt,
          claimStartedAt: work.updatedAt,
        }))
        .where(
          leasedProcessingPredicate({
            idColumn: fulfillmentWork.id,
            id: input.workId,
            stateColumn: fulfillmentWork.state,
            leaseOwnerColumn: fulfillmentWork.leaseOwner,
            leaseExpiresAtColumn: fulfillmentWork.leaseExpiresAt,
            workerId: input.workerId,
          }),
        )
        .returning({ id: fulfillmentWork.id });
      if (rows.length !== 1) {
        throw new FulfillmentLeaseLostError("Fulfillment lease was lost before failure transition");
      }
    });
  },

  async claimEffect(workerId: string, leaseSeconds: number) {
    const rows = await db.execute<ClaimedEffect>(sql`
      with candidate as (
        select effect.id
        from app_private.fulfillment_effects as effect
        where ${claimEligibilityPredicate({
          stateColumn: sql.raw("effect.state"),
          nextAttemptAtColumn: sql.raw("effect.next_attempt_at"),
          leaseExpiresAtColumn: sql.raw("effect.lease_expires_at"),
        })}
        order by effect.next_attempt_at, effect.id
        for update skip locked
        limit 1
      )
      update app_private.fulfillment_effects as effect
      set ${claimTransitionMutation({
        attemptCountColumn: sql.raw("effect.attempt_count"),
        workerId,
        leaseSeconds,
      })}
      from candidate,
           app_private.fulfillment_work as work,
           app_private.checkout_intents as intent
      where effect.id = candidate.id
        and work.id = effect.work_id
        and intent.checkout_session_id = work.checkout_session_id
      returning
        effect.id,
        effect.work_id as "workId",
        effect.kind,
        effect.state,
        effect.idempotency_key as "idempotencyKey",
        effect.attempt_count as "attemptCount",
        effect.next_attempt_at as "nextAttemptAt",
        effect.lease_owner as "leaseOwner",
        effect.lease_expires_at as "leaseExpiresAt",
        effect.last_error_code as "lastErrorCode",
        effect.last_error_detail as "lastErrorDetail",
        effect.created_at as "createdAt",
        effect.updated_at as "updatedAt",
        work.order_id as "orderId",
        work.checkout_session_id as "checkoutSessionId",
        intent.id as "checkoutIntentId"
    `);
    return rows[0] ?? null;
  },

  async completeEffect(effectId: number, workerId: string): Promise<void> {
    const rows = await db
      .update(fulfillmentEffects)
      .set(releasedTransitionValues(fulfillmentTransitions.succeed.to))
      .where(
        leasedProcessingPredicate({
          idColumn: fulfillmentEffects.id,
          id: effectId,
          stateColumn: fulfillmentEffects.state,
          leaseOwnerColumn: fulfillmentEffects.leaseOwner,
          workerId,
        }),
      )
      .returning({ id: fulfillmentEffects.id });
    if (rows.length !== 1) throw new FulfillmentLeaseLostError("Effect lease was lost before completion");
  },

  async splitLegacyBundledEmailEffect(input: {
    effectId: number;
    workId: number;
    workerId: string;
  }): Promise<void> {
    await db.transaction(async (tx) => {
      const rows = await tx
        .update(fulfillmentEffects)
        .set(releasedTransitionValues(fulfillmentTransitions.succeed.to))
        .where(
          leasedProcessingPredicate({
            idColumn: fulfillmentEffects.id,
            id: input.effectId,
            stateColumn: fulfillmentEffects.state,
            leaseOwnerColumn: fulfillmentEffects.leaseOwner,
            workerId: input.workerId,
          }),
        )
        .returning({ id: fulfillmentEffects.id });
      if (rows.length !== 1) {
        throw new FulfillmentLeaseLostError("Bundled email effect lease was lost before splitting");
      }

      await tx
        .insert(fulfillmentEffects)
        .values(buildOrderEmailEffects(input.workId))
        .onConflictDoNothing({ target: fulfillmentEffects.idempotencyKey });
    });
  },

  async completeCartCleanup(input: {
    effectId: number;
    workerId: string;
    userId: string;
    purchases: readonly { cartItemId: number; quantity: number }[];
  }): Promise<void> {
    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(fulfillmentEffects)
        .set({
          ...releasedTransitionValues(fulfillmentTransitions.succeed.to),
        })
        .where(
          leasedProcessingPredicate({
            idColumn: fulfillmentEffects.id,
            id: input.effectId,
            stateColumn: fulfillmentEffects.state,
            leaseOwnerColumn: fulfillmentEffects.leaseOwner,
            workerId: input.workerId,
          }),
        )
        .returning({ id: fulfillmentEffects.id });
      if (!claimed) throw new FulfillmentLeaseLostError("Cart cleanup lease was lost before commit");

      await consumePurchasedInTransaction(
        tx,
        input.userId,
        input.purchases,
      );
    });
  },

  async failEffect(input: FailureTransition & {
    effectId: number;
  }): Promise<void> {
    const rows = await db
      .update(fulfillmentEffects)
      .set(failureTransitionValues(input))
      .where(
        leasedProcessingPredicate({
          idColumn: fulfillmentEffects.id,
          id: input.effectId,
          stateColumn: fulfillmentEffects.state,
          leaseOwnerColumn: fulfillmentEffects.leaseOwner,
          workerId: input.workerId,
        }),
      )
      .returning({ id: fulfillmentEffects.id });
    if (rows.length !== 1) throw new FulfillmentLeaseLostError("Effect lease was lost before failure transition");
  },

  findOrder(orderId: number) {
    return ordersRepository.findById(orderId);
  },
};
