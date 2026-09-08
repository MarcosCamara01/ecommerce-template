import "server-only";

import type Stripe from "stripe";

import { dataAccess } from "@/lib/data-access";
import { assertUserPrincipal, type UserPrincipal } from "@/lib/identity";
import { stripe } from "@/lib/stripe";

export async function retrieveOwnedCheckoutSession(
  value: UserPrincipal,
  checkoutSessionId: string,
): Promise<Stripe.Checkout.Session | null> {
  const principal = assertUserPrincipal(value);
  if (!checkoutSessionId.startsWith("cs_")) return null;

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["payment_intent"],
  });
  const intentId = session.metadata?.checkoutIntentId;
  if (
    !intentId ||
    !(await dataAccess
      .forUser(principal)
      .checkout.ownsSession(intentId, session.id))
  ) {
    return null;
  }
  return session;
}
