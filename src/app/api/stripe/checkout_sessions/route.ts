import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

async function handler(req: NextRequest, res: NextResponse) {
  const query = new URL(req.url).searchParams;
  const session_id: string = query.get("session_id") as string;

  try {
    if (!session_id.startsWith("cs_")) {
      throw Error("Incorrect CheckoutSession ID.");
    }
    const checkout_session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["payment_intent"],
      });

    return NextResponse.json(checkout_session);
  } catch (err: any) {
    return NextResponse.json({ statusCode: 500, message: err.message });
  }
}

export { handler as GET };
