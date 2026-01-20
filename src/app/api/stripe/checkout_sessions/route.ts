import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams;
  const sessionId = query.get("session_id");

  try {
    if (!sessionId || !sessionId.startsWith("cs_")) {
      throw Error("Invalid CheckoutSession ID");
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    return NextResponse.json(checkoutSession);
  } catch (err) {
    return NextResponse.json(
      {
        statusCode: 500,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
