import "server-only";

import { createHash } from "node:crypto";

import { getPrincipal, type UserPrincipal } from "@/lib/identity";
import { requestFulfillment } from "@/lib/order-fulfillment";
import { retrieveOwnedCheckoutSession } from "@/lib/order-fulfillment/owned-checkout-session";
import { stripe, Stripe } from "@/lib/stripe";
import { stripeLogger } from "@/lib/stripe/logger";

export { stripe };

type StripeCustomerClient = Pick<typeof stripe, "customers">;

export async function getOrCreateStripeCustomerWithClient(
  client: StripeCustomerClient,
  principal: UserPrincipal,
  email: string,
): Promise<string> {
  const escapedUserId = principal.userId
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
  const owned = await client.customers.search({
    query: `metadata['userId']:'${escapedUserId}'`,
    limit: 1,
  });
  if (owned.data[0]) return owned.data[0].id;

  const existing = await client.customers.list({ email, limit: 100 });
  const ownedCustomer = existing.data.find(
    (customer) => customer.metadata?.userId === principal.userId,
  );
  if (ownedCustomer) return ownedCustomer.id;

  const customer = await client.customers.create(
    {
      email,
      metadata: { userId: principal.userId, source: "ecommerce-template" },
    },
    {
      idempotencyKey: `customer:${createHash("sha256")
        .update(principal.userId)
        .digest("hex")}`,
    },
  );
  stripeLogger.info(`Created Stripe customer ${customer.id}`);
  return customer.id;
}

export async function getOrCreateStripeCustomer(
  principal: UserPrincipal,
  email: string,
): Promise<string> {
  return getOrCreateStripeCustomerWithClient(stripe, principal, email);
}

export type CheckoutStatus =
  | "success"
  | "pending"
  | "expired"
  | "canceled"
  | "failed"
  | "not_found"
  | "error";

export interface CheckoutResult {
  status: CheckoutStatus;
  session?: Stripe.Checkout.Session;
  error?: string;
}

export async function fetchCheckoutData(sessionId: string): Promise<CheckoutResult> {
  try {
    if (!sessionId.startsWith("cs_")) {
      return { status: "not_found", error: "Invalid session" };
    }
    const principal = await getPrincipal();
    if (!principal) return { status: "not_found" };
    const session = await retrieveOwnedCheckoutSession(principal, sessionId);
    if (!session) return { status: "not_found" };
    if (session.status === "complete" && session.payment_status === "paid") {
      await requestFulfillment(principal, session.id);
      return { status: "success", session };
    }
    if (session.status === "expired") return { status: "expired", session };
    if (session.status === "open") return { status: "pending", session };
    if (session.payment_status === "unpaid") return { status: "canceled", session };
    return { status: "failed", session };
  } catch (error) {
    if (
      error instanceof Stripe.errors.StripeError &&
      (error.type === "StripeInvalidRequestError" || error.code === "resource_missing")
    ) {
      return { status: "not_found", error: error.message };
    }
    stripeLogger.error("Error fetching checkout data", error);
    return { status: "error", error: "Could not verify payment state" };
  }
}

export async function handleExpiredSession(session: Stripe.Checkout.Session) {
  stripeLogger.info("Checkout session expired", {
    sessionId: session.id,
    details: { userId: session.metadata?.userId, amount: session.amount_total },
  });
}
