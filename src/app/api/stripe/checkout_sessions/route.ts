import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { stripe } from "@/lib/stripe";

const checkoutSessionQuerySchema = z.object({
  session_id: z.string().startsWith("cs_", "Invalid CheckoutSession ID"),
});

export async function GET(req: NextRequest) {
  try {
    const parsed = checkoutSessionQuerySchema.safeParse({
      session_id: req.nextUrl.searchParams.get("session_id"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          statusCode: 400,
          message: "Invalid CheckoutSession ID",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(
      parsed.data.session_id,
      {
      expand: ["payment_intent"],
      },
    );

    return NextResponse.json(checkoutSession);
  } catch (err) {
    if (
      err instanceof Stripe.errors.StripeError &&
      (err.type === "StripeInvalidRequestError" ||
        err.code === "resource_missing")
    ) {
      return NextResponse.json(
        {
          statusCode: 404,
          message: err.message,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        statusCode: 500,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
