import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { stripeLogger } from "@/lib/stripe/logger";
import { getOrCreateStripeCustomer } from "@/services/stripe.service";
import { auth } from "@/utils/auth";
import { cartRepository } from "@/lib/db/drizzle/repositories/cart.repository";

const SESSION_EXPIRY_MINUTES = 30;

const checkoutRequestSchema = z.object({
  cartItemIds: z.array(z.number()).min(1, "Cart is empty"),
});

export async function POST(request: NextRequest) {
  try {
    const authSession = await auth.api.getSession({ headers: request.headers });

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = authSession.user.id;
    const userEmail = authSession.user.email;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { statusCode: 400, message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsedBody = checkoutRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          statusCode: 400,
          message: "Invalid checkout payload",
          details: parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { cartItemIds } = parsedBody.data;

    const userCartItems = await cartRepository.findByUserId(userId);

    const cartItemsList = userCartItems.filter((item) =>
      cartItemIds.includes(item.id),
    );

    if (cartItemsList.length === 0) {
      return NextResponse.json(
        { statusCode: 400, message: "No valid cart items found" },
        { status: 400 },
      );
    }

    if (cartItemsList.length !== cartItemIds.length) {
      stripeLogger.warn("Some cart items not found or unauthorized", {
        details: {
          requestedIds: cartItemIds,
          foundIds: cartItemsList.map((item) => item.id),
        },
      });
    }

    const lineItemsList = cartItemsList.map((item) => {
      if (!item.stripeId) {
        throw new Error(`Missing stripeId for variant ${item.variantId}`);
      }
      return { price: item.stripeId, quantity: item.quantity || 1 };
    });

    const customerId = userEmail
      ? await getOrCreateStripeCustomer(userId, userEmail)
      : undefined;

    const expiresAt =
      Math.floor(Date.now() / 1000) + SESSION_EXPIRY_MINUTES * 60;
    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      ...(customerId && { customer: customerId }),
      ...(!customerId && userEmail && { customer_email: userEmail }),
      line_items: lineItemsList,
      mode: "payment",
      expires_at: expiresAt,
      invoice_creation: { enabled: true },
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      success_url: `${origin}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      automatic_tax: { enabled: false },
      metadata: {
        userId,
        cartItemIds: cartItemIds.join(","),
      },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session URL is missing");
    }

    stripeLogger.info("Checkout session created", {
      sessionId: session.id,
      details: { userId, itemCount: cartItemsList.length },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    stripeLogger.error("Failed to create checkout session", error);
    return NextResponse.json(
      {
        statusCode: 500,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
