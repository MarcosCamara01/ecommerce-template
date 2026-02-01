import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { stripeLogger } from "@/lib/stripe/logger";
import { handleWebhookEvent } from "@/lib/stripe/handlers";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

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

    stripeLogger.webhook(event.type, event.id, "received");

    const result = await handleWebhookEvent(event);
    const processingTime = Date.now() - startTime;

    if (!result.success) {
      stripeLogger.webhook(event.type, event.id, "failed", {
        error: result.error,
        processingTimeMs: processingTime,
      });

      // 500 triggers Stripe retry, 200 acknowledges without retry
      if (result.retryable) {
        return NextResponse.json(
          { error: "Temporary processing error", retryable: true },
          { status: 500 }
        );
      }

      return NextResponse.json({
        received: true,
        processed: false,
        error: result.error,
      });
    }

    stripeLogger.webhook(event.type, event.id, "processed", {
      handled: result.handled,
      processingTimeMs: processingTime,
    });

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
