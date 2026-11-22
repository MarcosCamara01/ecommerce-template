import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { createHash, randomUUID } from "node:crypto";

import { planCheckoutIntent } from "@/lib/cart/checkout-intent-plan";

import { db } from "../connection";
import {
  checkoutIntents,
  type CheckoutIntent,
  type CheckoutIntentItem,
} from "../schema/checkout";

type OwnedCheckoutOutcomeRecord = Readonly<{
  workState: "pending" | "processing" | "succeeded" | "needs_attention" | null;
  orderId: number | null;
  customerEmailState:
    | "pending"
    | "processing"
    | "succeeded"
    | "needs_attention"
    | null;
  customerEmailLastErrorCode: string | null;
  cartCleanupState:
    | "pending"
    | "processing"
    | "succeeded"
    | "needs_attention"
    | null;
}>;

const CHECKOUT_INTENT_LOCK_NAMESPACE = 42_002;
// Stripe refuses expires_at less than 30 minutes after a session is created.
const STRIPE_MIN_SESSION_MINUTES = 30;
const SESSION_MINUTES = STRIPE_MIN_SESSION_MINUTES + 1;
const REUSE_MIN_REMAINING = sql`interval '5 minutes'`;
const MAX_OPEN_INTENTS = 50;

function checkoutLockKey(userId: string): number {
  return createHash("sha256").update(userId).digest().readInt32BE(0);
}

type RawOwnedCheckoutOutcomeRecord = Omit<
  OwnedCheckoutOutcomeRecord,
  "orderId"
> & { orderId: string | null };

async function bindCheckoutIntent(
  userId: string,
  intentId: string,
  checkoutSessionId: string,
): Promise<CheckoutIntent | null> {
  const rows = await db.execute<CheckoutIntent>(sql`
    select id,
           user_id as "userId",
           checkout_session_id as "checkoutSessionId",
           items,
           expires_at as "expiresAt",
           created_at as "createdAt"
    from app_private.bind_checkout_intent(
      ${userId},
      ${intentId},
      ${checkoutSessionId}
    )
  `);
  return rows[0] ?? null;
}

export const checkoutRepository = {
  async claim(
    userId: string,
    items: CheckoutIntentItem[],
    staleIntentIds: readonly string[],
  ) {
    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${CHECKOUT_INTENT_LOCK_NAMESPACE}, ${checkoutLockKey(userId)})`,
      );
      const open = await tx
        .select({
          id: checkoutIntents.id,
          userId: checkoutIntents.userId,
          checkoutSessionId: checkoutIntents.checkoutSessionId,
          items: checkoutIntents.items,
          expiresAt: checkoutIntents.expiresAt,
          createdAt: checkoutIntents.createdAt,
          reusable: sql<boolean>`${checkoutIntents.expiresAt} > now() + ${REUSE_MIN_REMAINING}
            and (${checkoutIntents.checkoutSessionId} is not null
              or ${checkoutIntents.expiresAt} > now() + make_interval(mins => ${STRIPE_MIN_SESSION_MINUTES}))`,
        })
        .from(checkoutIntents)
        .where(
          and(
            eq(checkoutIntents.userId, userId),
            gt(checkoutIntents.expiresAt, sql`now()`),
          ),
        )
        .orderBy(desc(checkoutIntents.createdAt))
        .limit(MAX_OPEN_INTENTS);
      const plan = planCheckoutIntent(open, items, new Set(staleIntentIds));
      if (plan.reuse) {
        return { intent: plan.reuse, supersededSessionIds: plan.supersededSessionIds };
      }
      const [intent] = await tx
        .insert(checkoutIntents)
        .values({
          id: randomUUID(),
          userId,
          items,
          expiresAt: new Date(Date.now() + SESSION_MINUTES * 60 * 1000),
        })
        .returning();
      if (!intent) throw new Error("Checkout intent insert returned no row");
      return { intent, supersededSessionIds: plan.supersededSessionIds };
    });
  },

  async bind(userId: string, intentId: string, checkoutSessionId: string) {
    const intent = await bindCheckoutIntent(userId, intentId, checkoutSessionId);
    if (!intent) throw new Error("Checkout intent was not found for binding");
    return intent;
  },

  async findOwned(userId: string, intentId: string, checkoutSessionId: string) {
    return db.query.checkoutIntents.findFirst({
      where: and(
        eq(checkoutIntents.id, intentId),
        eq(checkoutIntents.userId, userId),
        eq(checkoutIntents.checkoutSessionId, checkoutSessionId),
      ),
    });
  },

  async findOwnedOutcome(
    userId: string,
    checkoutSessionId: string,
  ): Promise<OwnedCheckoutOutcomeRecord | null> {
    const rows = await db.execute<RawOwnedCheckoutOutcomeRecord>(sql`
      select work.state as "workState",
             work.order_id as "orderId",
             customer_email.state as "customerEmailState",
             customer_email.last_error_code as "customerEmailLastErrorCode",
             cart_cleanup.state as "cartCleanupState"
      from app_private.checkout_intents as intent
      left join app_private.fulfillment_work as work
        on work.checkout_session_id = intent.checkout_session_id
      left join app_private.fulfillment_effects as customer_email
        on customer_email.idempotency_key =
          'work:' || work.id::text || ':email:customer'
      left join app_private.fulfillment_effects as cart_cleanup
        on cart_cleanup.idempotency_key =
          'order:' || work.order_id::text || ':cart-cleanup'
      where intent.user_id = ${userId}
        and intent.checkout_session_id = ${checkoutSessionId}
      limit 1
    `);
    const row = rows[0];
    if (!row) return null;
    const orderId = row.orderId === null ? null : Number(row.orderId);
    if (
      orderId !== null &&
      (!Number.isSafeInteger(orderId) || orderId <= 0)
    ) {
      throw new Error("PostgreSQL returned an invalid fulfillment order id");
    }
    return { ...row, orderId };
  },

  async findBySession(intentId: string, checkoutSessionId: string) {
    const intent = await db.query.checkoutIntents.findFirst({
      where: eq(checkoutIntents.id, intentId),
    });
    if (!intent) return undefined;
    return (await bindCheckoutIntent(
      intent.userId,
      intentId,
      checkoutSessionId,
    )) ?? undefined;
  },
};
