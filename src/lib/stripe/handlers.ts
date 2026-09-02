import type Stripe from "stripe";

import type { SystemPrincipal } from "@/lib/identity";
import { registerStripeEvent } from "@/lib/order-fulfillment";
import { handleExpiredSession } from "@/services/stripe.service";

const WORK_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
]);

export interface EventReceiptResult {
  success: true;
  handled: boolean;
}

export async function registerEventReceipt(
  systemPrincipal: SystemPrincipal,
  event: Stripe.Event,
): Promise<EventReceiptResult> {
  await registerStripeEvent(systemPrincipal, event);
  if (event.type === "checkout.session.expired") {
    await handleExpiredSession(event.data.object as Stripe.Checkout.Session);
  }
  return { success: true, handled: WORK_EVENTS.has(event.type) };
}
