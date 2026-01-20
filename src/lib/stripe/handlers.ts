import type Stripe from "stripe";
import { stripeLogger } from "./logger";
import { processCompletedOrder } from "@/services/stripe.service";
import { sendEmail } from "@/lib/email";

const HANDLED_EVENTS = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.canceled",
  "charge.succeeded",
] as const;

type HandledEventType = (typeof HANDLED_EVENTS)[number];

const IGNORED_EVENTS = [
  "customer.created",
  "customer.updated",
  "charge.updated",
  "payment_intent.created",
  "invoice.created",
  "invoice.finalized",
  "invoice.sent",
  "invoice.paid",
  "invoice.payment_succeeded",
  "invoice_payment.paid",
] as const;

export function isHandledEvent(
  eventType: string
): eventType is HandledEventType {
  return HANDLED_EVENTS.includes(eventType as HandledEventType);
}

export function isIgnoredEvent(eventType: string): boolean {
  return IGNORED_EVENTS.includes(eventType as (typeof IGNORED_EVENTS)[number]);
}

interface WebhookResult {
  success: boolean;
  handled: boolean;
  error?: string;
}

export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<WebhookResult> {
  const { type: eventType } = event;

  if (isIgnoredEvent(eventType)) {
    return { success: true, handled: false };
  }

  if (!isHandledEvent(eventType)) {
    if (process.env.NODE_ENV === "development") {
      stripeLogger.warn(`Unknown event type: ${eventType}`);
    }
    return { success: true, handled: false };
  }

  try {
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.succeeded":
      case "payment_intent.canceled":
      case "charge.succeeded":
        break;
    }

    return { success: true, handled: true };
  } catch (error) {
    stripeLogger.error(`Failed to process order`, error);
    return {
      success: false,
      handled: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const orderDetails = await processCompletedOrder(session);
  stripeLogger.order(orderDetails.order.orderNumber, "created");
  await sendEmail(session, orderDetails);
}
