import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { IdentityError, requirePrincipalFromHeaders } from "@/lib/identity";
import { retrieveOwnedCheckoutSession } from "@/lib/order-fulfillment/owned-checkout-session";

const querySchema = z.object({
  session_id: z.string().startsWith("cs_", "Invalid CheckoutSession ID"),
});

export async function GET(request: NextRequest) {
  try {
    const principal = await requirePrincipalFromHeaders(request.headers);
    const query = querySchema.parse({
      session_id: request.nextUrl.searchParams.get("session_id"),
    });
    const session = await retrieveOwnedCheckoutSession(
      principal,
      query.session_id,
    );
    if (!session) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof IdentityError) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (
      error instanceof Stripe.errors.StripeError &&
      (error.type === "StripeInvalidRequestError" || error.code === "resource_missing")
    ) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid session id" }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Unable to retrieve checkout session" },
      { status: 500 },
    );
  }
}
