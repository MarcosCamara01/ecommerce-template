import { after } from "next/server";

import { runFulfillmentSweep } from "@/lib/order-fulfillment";
import { getOrderFulfillmentSystemPrincipal } from "@/lib/order-fulfillment/system-principal";
import { registerEventReceipt } from "@/lib/stripe/handlers";
import { stripe } from "@/lib/stripe";
import { stripeLogger } from "@/lib/stripe/logger";
import { createStripeWebhookHandler } from "@/lib/stripe/webhook-handler";

export const POST = createStripeWebhookHandler({
  getWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET,
  constructEvent: (payload, signature, secret) =>
    stripe.webhooks.constructEvent(payload, signature, secret),
  registerEvent: async (event) => {
    const systemPrincipal = getOrderFulfillmentSystemPrincipal();
    const result = await registerEventReceipt(systemPrincipal, event);
    after(async () => {
      try {
        await runFulfillmentSweep(systemPrincipal, { limit: 2 });
      } catch (error) {
        stripeLogger.error("Background fulfillment sweep failed", error);
      }
    });
    return result;
  },
  logger: stripeLogger,
});
