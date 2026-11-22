import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { dataAccess, DataAccessError } from "@/lib/data-access";
import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { catalogPriceCentsFromStoredDecimal } from "@/lib/catalog-sync/money";
import { getIdentityFromHeaders, IdentityError } from "@/lib/identity";
import { createCheckoutMetadata } from "@/lib/order-fulfillment/checkout-snapshot";
import { stripe } from "@/lib/stripe";
import { buildLineItems } from "@/lib/stripe/line-items";
import { stripeLogger } from "@/lib/stripe/logger";
import { stripeEurChargeTotal } from "@/lib/stripe/amount-limits";
import { getOrCreateStripeCustomer } from "@/services/stripe.service";

const MAX_CHECKOUT_ITEMS = 100;
const STRIPE_INTEGRATION_IDENTIFIER = "ecommerce_template_qxmdkztr";
const MAX_INTENT_CLAIMS = 3;
// Stripe answers 409 while a request with the same idempotency key is in
// flight; the client retries 409s, so concurrent checkouts wait for one result.
const CONCURRENT_CREATE_RETRIES = 4;
const checkoutRequestSchema = z.object({
  cartItemIds: z
    .array(z.number().int().positive())
    .min(1, "Cart is empty")
    .max(MAX_CHECKOUT_ITEMS, "Cart has too many items"),
});

async function expireSupersededSessions(
  sessionIds: readonly string[],
): Promise<{ alreadyPaidSessionId: string | null }> {
  for (const sessionId of sessionIds) {
    const current = await stripe.checkout.sessions.retrieve(sessionId);
    if (current.status === "complete") return { alreadyPaidSessionId: current.id };
    if (current.status !== "open") continue;
    try {
      await stripe.checkout.sessions.expire(sessionId);
    } catch (error) {
      const settled = await stripe.checkout.sessions.retrieve(sessionId);
      if (settled.status === "complete") return { alreadyPaidSessionId: settled.id };
      if (settled.status !== "expired") throw error;
    }
  }
  return { alreadyPaidSessionId: null };
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getIdentityFromHeaders(request.headers);
    if (!identity) {
      throw new IdentityError("authentication_required", "Authentication is required");
    }
    const { principal, email } = identity;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { statusCode: 400, message: "Invalid JSON body" },
          { status: 400 },
        );
      }
      throw error;
    }
    const body = checkoutRequestSchema.parse(payload);
    const cartItems = await dataAccess
      .forUser(principal)
      .cart.checkoutItems(body.cartItemIds);
    const distinctResolvedIds = new Set(cartItems.map((item) => item.id));
    if (
      cartItems.length > MAX_CHECKOUT_ITEMS ||
      distinctResolvedIds.size !== cartItems.length
    ) {
      return NextResponse.json(
        { statusCode: 400, message: "Invalid checkout request" },
        { status: 400 },
      );
    }
    const snapshot = cartItems.map((item) => ({
      cartItemId: item.id,
      variantId: item.variantId,
      size: item.size,
      quantity: item.quantity,
      priceId: item.variant.stripeId,
      unitAmount: catalogPriceCentsFromStoredDecimal(item.product.price),
      currency: "eur",
      productName: item.product.name,
      variantColor: item.variant.color,
      imageUrl: item.variant.images[0] ?? item.product.img,
    }));
    if (stripeEurChargeTotal(snapshot) === null) {
      return NextResponse.json(
        { statusCode: 400, message: "Invalid checkout request" },
        { status: 400 },
      );
    }
    const userData = dataAccess.forUser(principal);
    const lineItems = buildLineItems(cartItems);
    const appOrigin = getCanonicalAppOrigin();
    const resultUrl = (sessionId: string) =>
      `${appOrigin}/result?session_id=${sessionId}`;
    const staleIntentIds: string[] = [];
    for (let attempt = 0; attempt < MAX_INTENT_CLAIMS; attempt += 1) {
      const { intent, supersededSessionIds } = await userData.checkout.claimIntent(
        snapshot,
        staleIntentIds,
      );
      const { alreadyPaidSessionId } =
        await expireSupersededSessions(supersededSessionIds);
      if (alreadyPaidSessionId) {
        return NextResponse.json({ url: resultUrl(alreadyPaidSessionId) });
      }

      if (intent.checkoutSessionId) {
        const existing = await stripe.checkout.sessions.retrieve(
          intent.checkoutSessionId,
        );
        if (existing.status === "open" && existing.url) {
          return NextResponse.json({ url: existing.url });
        }
        if (existing.status === "complete") {
          return NextResponse.json({ url: resultUrl(existing.id) });
        }
        staleIntentIds.push(intent.id);
        continue;
      }

      const session = await stripe.checkout.sessions.create(
        {
          integration_identifier: STRIPE_INTEGRATION_IDENTIFIER,
          customer: await getOrCreateStripeCustomer(principal, email),
          line_items: lineItems,
          mode: "payment",
          // Stripe rejects a reused idempotency key whose parameters differ.
          expires_at: Math.floor(intent.expiresAt.getTime() / 1000),
          invoice_creation: { enabled: true },
          billing_address_collection: "required",
          phone_number_collection: { enabled: true },
          success_url: `${appOrigin}/result?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appOrigin}/cart`,
          automatic_tax: { enabled: false },
          metadata: createCheckoutMetadata(intent.id),
        },
        {
          idempotencyKey: `checkout-intent:${intent.id}`,
          maxNetworkRetries: CONCURRENT_CREATE_RETRIES,
        },
      );
      if (!session.url) throw new Error("Stripe checkout session URL is missing");
      try {
        await userData.checkout.bindIntent(intent.id, session.id);
      } catch (error) {
        await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
        throw error;
      }
      return NextResponse.json({ url: session.url });
    }
    throw new Error("No open checkout intent could be claimed");
  } catch (error) {
    stripeLogger.error("Failed to create checkout session", error);
    const status =
      error instanceof DataAccessError && error.code === "not_found" ? 400 :
      error instanceof z.ZodError ? 400 :
      error instanceof IdentityError ? 401 : 500;
    return NextResponse.json(
      {
        statusCode: status,
        message: status === 500
          ? "Checkout failed"
          : status === 401
            ? "Unauthorized"
            : "Invalid checkout request",
      },
      { status },
    );
  }
}
