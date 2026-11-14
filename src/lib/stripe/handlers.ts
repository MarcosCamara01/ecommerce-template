import type Stripe from "stripe";

import type { SystemPrincipal } from "@/lib/identity";
import { registerStripeEvent } from "@/lib/order-fulfillment";
import { stripeLogger } from "@/lib/stripe/logger";

const WORK_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
]);

export async function registerEventReceipt(
  systemPrincipal: SystemPrincipal,
  event: Stripe.Event,
): Promise<{ handled: boolean }> {
  await registerStripeEvent(systemPrincipal, event);
  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    stripeLogger.info("Checkout session expired", {
      sessionId: session.id,
      details: { userId: session.metadata?.userId, amount: session.amount_total },
    });
  }
  return { handled: WORK_EVENTS.has(event.type) };
}
