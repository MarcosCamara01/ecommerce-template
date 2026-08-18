import "server-only";

import { randomUUID } from "node:crypto";
import type Stripe from "stripe";

import { dataAccess, type FulfillmentOrderInput } from "@/lib/data-access";
import {
  assertSystemPrincipal,
  assertUserPrincipal,
  type SystemPrincipal,
  type UserPrincipal,
} from "@/lib/identity";
import { sendEmail } from "@/lib/email";
import { stripe } from "@/lib/stripe";
import { stripeLogger } from "@/lib/stripe/logger";
import type { FulfillmentWorkRow } from "@/lib/db/drizzle/schema";

import {
  assertReferencedVariantsExist,
  reconcileChargedItems,
  parseStripeChargedLineItem,
  type ChargedLineItem,
} from "./checkout-snapshot";
import {
  FulfillmentFailure,
  classifyFulfillmentError,
  retryAt,
} from "./retry";
import { getOrderFulfillmentSystemPrincipal } from "./system-principal";
import { retrieveOwnedCheckoutSession } from "./owned-checkout-session";
import {
  executeOrderEmailEffect,
  isLegacyBundledEmailEffect,
  orderEmailDeliveryFromIdempotencyKey,
} from "./email-effect";
import {
  FulfillmentLeaseLostError,
  persistFailureUnlessLeaseLost,
} from "./lease-race";

const LEASE_SECONDS = 60;

export async function registerStripeEvent(
  value: SystemPrincipal,
  event: Stripe.Event,
): Promise<void> {
  const system = assertSystemPrincipal(value, "order-fulfillment");
  await dataAccess.forSystem(system).fulfillment.registerEvent(event);
}

export async function requestFulfillment(
  value: UserPrincipal,
  checkoutSessionId: string,
): Promise<void> {
  const principal = assertUserPrincipal(value);
  const session = await retrieveOwnedCheckoutSession(principal, checkoutSessionId);
  if (!session) {
    throw new FulfillmentFailure("session_not_owned", false, "Checkout session not found");
  }
  if (session.status === "complete" && session.payment_status === "paid") {
    const system = getOrderFulfillmentSystemPrincipal();
    await dataAccess.forSystem(system).fulfillment.ensureWork(session.id);
  }
}

export async function runFulfillmentSweep(
  value: SystemPrincipal,
  options: { limit?: number } = {},
  dependencies: { sendEmail: typeof sendEmail } = { sendEmail },
) {
  const system = assertSystemPrincipal(value, "order-fulfillment");
  const access = dataAccess.forSystem(system);
  const workerId = `fulfillment:${randomUUID()}`;
  const limit = Math.min(Math.max(options.limit ?? 5, 1), 25);
  let workProcessed = 0;
  let effectsProcessed = 0;

  for (let index = 0; index < limit; index += 1) {
    const work = await access.fulfillment.claimWork(workerId, LEASE_SECONDS);
    if (!work) break;
    await processWork(work, workerId, access);
    workProcessed += 1;
  }

  for (let index = 0; index < limit * 2; index += 1) {
    const effect = await access.fulfillment.claimEffect(workerId, LEASE_SECONDS);
    if (!effect) break;
    try {
      const order = await access.fulfillment.findOrder(effect.orderId);
      if (!order) {
        throw new FulfillmentFailure("order_missing", false, "Effect order is missing");
      }
      if (effect.kind === "order_email") {
        if (isLegacyBundledEmailEffect(effect.idempotencyKey)) {
          await access.fulfillment.splitLegacyBundledEmailEffect({
            effectId: effect.id,
            workId: effect.workId,
            workerId,
          });
        } else {
          const delivery = orderEmailDeliveryFromIdempotencyKey(
            effect.idempotencyKey,
          );
          if (!delivery) {
            throw new FulfillmentFailure(
              "invalid_email_delivery",
              false,
              "Order email effect has no supported delivery target",
            );
          }
          await executeOrderEmailEffect(effect, delivery, {
            send: (target, idempotencyKey) =>
              dependencies.sendEmail(order, target, idempotencyKey),
            complete: (effectId) =>
              access.fulfillment.completeEffect(effectId, workerId),
          });
        }
      } else {
        const intent = await access.checkout.resolve(
          effect.checkoutIntentId,
          effect.checkoutSessionId,
        );
        if (!intent || intent.userId !== order.userId) {
          throw new FulfillmentFailure(
            "checkout_intent_missing",
            false,
            "Cart cleanup has no application-owned checkout intent",
          );
        }
        await access.fulfillment.completeCartCleanup({
          effectId: effect.id,
          workerId,
          userId: order.userId,
          purchases: intent.items,
        });
      }
    } catch (error) {
      if (error instanceof FulfillmentLeaseLostError) continue;
      const failure = classifyFulfillmentError(error);
      await persistFailureUnlessLeaseLost(() =>
        access.fulfillment.failEffect({
          effectId: effect.id,
          workerId,
          code: failure.code,
          detail: failure.detail,
          retryAt: retryAt(effect.attemptCount, failure.retryable),
        })
      );
    }
    effectsProcessed += 1;
  }

  return { workProcessed, effectsProcessed };
}

async function processWork(
  work: FulfillmentWorkRow,
  workerId: string,
  access: ReturnType<typeof dataAccess.forSystem>,
) {
  try {
    const session = await stripe.checkout.sessions.retrieve(work.checkoutSessionId);
    if (session.status !== "complete" || session.payment_status !== "paid") {
      throw new FulfillmentFailure(
        "payment_not_final",
        session.status !== "expired",
        "Checkout payment is not complete and paid",
      );
    }
    const checkoutIntentId = session.metadata?.checkoutIntentId;
    if (!checkoutIntentId) {
      throw new FulfillmentFailure(
        "missing_checkout_intent",
        false,
        "Checkout metadata has no intent id",
      );
    }
    const intent = await access.checkout.resolve(checkoutIntentId, session.id);
    if (!intent) {
      throw new FulfillmentFailure(
        "checkout_intent_missing",
        false,
        "No application-owned checkout intent matches the Stripe session",
      );
    }
    const userId = intent.userId;
    const snapshot = intent.items;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
    });
    if (lineItems.has_more) {
      throw new FulfillmentFailure(
        "too_many_line_items",
        false,
        "Checkout contains more line items than the supported bound",
      );
    }
    const charged: ChargedLineItem[] = lineItems.data.map(
      parseStripeChargedLineItem,
    );
    if (!session.amount_total || !session.amount_subtotal || !session.currency) {
      throw new FulfillmentFailure(
        "missing_total",
        false,
        "Paid checkout has no amount or currency",
      );
    }
    const normalizedCurrency = session.currency.toLowerCase();
    const chargedSubtotal = charged.reduce(
      (total, item) => total + item.unitAmount * item.quantity,
      0,
    );
    if (
      chargedSubtotal !== session.amount_subtotal ||
      session.amount_total !== session.amount_subtotal ||
      charged.some((item) => item.currency.toLowerCase() !== normalizedCurrency)
    ) {
      throw new FulfillmentFailure(
        "charged_total_mismatch",
        false,
        "Stripe line items do not match the charged checkout total",
      );
    }
    const reconciled = reconcileChargedItems(snapshot, charged);
    const variants = await access.findVariants(
      Array.from(new Set(reconciled.map((item) => item.variantId))),
    );
    assertReferencedVariantsExist(reconciled, variants);
    const address = session.customer_details?.address;
    if (!address?.line1 || !address.city || !address.postal_code || !address.country) {
      throw new FulfillmentFailure(
        "missing_address",
        false,
        "Paid checkout has no complete delivery address",
      );
    }
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const order: FulfillmentOrderInput = {
      order: { userId, deliveryDate },
      customer: {
        name: session.customer_details?.name || "Unknown",
        email: session.customer_details?.email || "unknown@email.invalid",
        phone: session.customer_details?.phone || undefined,
        address: {
          line1: address.line1,
          line2: address.line2 ?? undefined,
          city: address.city,
          state: address.state ?? undefined,
          postal_code: address.postal_code,
          country: address.country,
        },
        stripeOrderId: session.id,
        totalPrice: session.amount_total,
        currency: session.currency,
      },
      products: reconciled.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        size: item.size,
        unitAmount: item.unitAmount,
        currency: item.currency,
      })),
    };
    const orderId = await access.fulfillment.completeWork(work, workerId, order);
    stripeLogger.info("Fulfillment committed", {
      sessionId: session.id,
      details: { orderId, attempt: work.attemptCount },
    });
  } catch (error) {
    if (error instanceof FulfillmentLeaseLostError) return;
    const failure = classifyFulfillmentError(error);
    await persistFailureUnlessLeaseLost(() =>
      access.fulfillment.failWork({
        workId: work.id,
        workerId,
        code: failure.code,
        detail: failure.detail,
        retryAt: retryAt(work.attemptCount, failure.retryable),
      })
    );
    stripeLogger.error("Fulfillment attempt failed", error, {
      sessionId: work.checkoutSessionId,
      details: { code: failure.code, retryable: failure.retryable },
    });
  }
}
