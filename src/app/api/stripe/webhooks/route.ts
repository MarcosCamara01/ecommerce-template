import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { stripeLogger } from "@/lib/stripe/logger";
import { handleWebhookEvent } from "@/lib/stripe/handlers";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      stripeLogger.error("Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      stripeLogger.error("Webhook signature verification failed", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Process the event
    const result = await handleWebhookEvent(event);

    if (!result.success) {
      // Return 200 even on processing errors to prevent Stripe retries
      // The error is logged and can be investigated
      return NextResponse.json({
        received: true,
        processed: false,
        error: result.error,
      });
    }

    return NextResponse.json({
      received: true,
      processed: result.handled,
    });
  } catch (error) {
    stripeLogger.error("Unexpected webhook error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
