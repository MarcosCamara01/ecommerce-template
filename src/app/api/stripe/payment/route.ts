import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { dataAccess, DataAccessError } from "@/lib/data-access";
import { catalogPriceCentsFromStoredDecimal } from "@/lib/catalog-sync/money";
import { getIdentityFromHeaders, IdentityError } from "@/lib/identity";
import { createCheckoutMetadata } from "@/lib/order-fulfillment/checkout-snapshot";
import { stripe } from "@/lib/stripe";
import { buildLineItems } from "@/lib/stripe/line-items";
import { stripeLogger } from "@/lib/stripe/logger";
import { stripeEurChargeTotal } from "@/lib/stripe/amount-limits";
import { getOrCreateStripeCustomer } from "@/services/stripe.service";

const SESSION_EXPIRY_MINUTES = 30;
const MAX_CHECKOUT_ITEMS = 100;
const STRIPE_INTEGRATION_IDENTIFIER = "ecommerce_template_qxmdkztr";
const checkoutRequestSchema = z.object({
  cartItemIds: z
    .array(z.number().int().positive())
    .min(1, "Cart is empty")
    .max(MAX_CHECKOUT_ITEMS, "Cart has too many items"),
});

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
    }));
    if (stripeEurChargeTotal(snapshot) === null) {
      return NextResponse.json(
        { statusCode: 400, message: "Invalid checkout request" },
        { status: 400 },
      );
    }
    const userData = dataAccess.forUser(principal);
    const intent = await userData.checkout.createIntent(snapshot);
    const lineItems = buildLineItems(cartItems);
    const session = await stripe.checkout.sessions.create({
      integration_identifier: STRIPE_INTEGRATION_IDENTIFIER,
      customer: await getOrCreateStripeCustomer(principal, email),
      line_items: lineItems,
      mode: "payment",
      expires_at:
        Math.floor(Date.now() / 1000) + SESSION_EXPIRY_MINUTES * 60,
      invoice_creation: { enabled: true },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      success_url: `${request.nextUrl.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/cart`,
      automatic_tax: { enabled: false },
      metadata: createCheckoutMetadata(intent.id),
    });
    if (!session.url) throw new Error("Stripe checkout session URL is missing");
    try {
      await userData.checkout.bindIntent(intent.id, session.id);
    } catch (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ url: session.url });
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
