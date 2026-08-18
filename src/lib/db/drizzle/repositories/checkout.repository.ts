import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../connection";
import {
  checkoutIntents,
  type CheckoutIntent,
  type CheckoutIntentItem,
} from "../schema";

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
  async create(userId: string, items: CheckoutIntentItem[]) {
    const [intent] = await db
      .insert(checkoutIntents)
      .values({
        id: randomUUID(),
        userId,
        items,
        expiresAt: new Date(Date.now() + 31 * 60 * 1000),
      })
      .returning();
    if (!intent) throw new Error("Checkout intent insert returned no row");
    return intent;
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
