import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { processCompletedOrder } from "@/services/stripe.service";
import { sendEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

const webhookHandler = async (req: NextRequest) => {
  try {
    const buf = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (err! instanceof Error) console.error(err);
      console.error(`❌ Error message: ${errorMessage}`);

      return NextResponse.json(
        {
          error: {
            message: `Webhook Error: ${errorMessage}`,
          },
        },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.info(`Checkout session completed: ${session.id}`);

        try {
          const orderDetails = await processCompletedOrder(session);
          await sendEmail(session, orderDetails);
        } catch (error) {
          console.error("Error saving order from webhook:", error);
          return NextResponse.json({
            received: true,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.info(`Payment succeeded: ${paymentIntent.id}`);
        break;

      case "charge.succeeded":
        const charge = event.data.object as Stripe.Charge;
        console.info(`Charge succeeded: ${charge.id}`);
        break;

      case "payment_intent.canceled":
        console.error("Payment was canceled");
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      {
        error: {
          message: `Method Not Allowed`,
        },
      },
      { status: 405 }
    ).headers.set("Allow", "POST");
  }
};

export { webhookHandler as POST };
