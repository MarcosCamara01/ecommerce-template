import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { CartItemSchema } from "@/schemas";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(request: NextRequest) {
  try {
    const { cartItems, userId } = await request.json();

    if (!cartItems || !userId) throw Error("Missing data");

    const cartItemsList = CartItemSchema.array().parse(cartItems);

    const lineItemsList = cartItemsList.map((item) => {
      if (!item.stripe_id) {
        throw new Error("Missing stripeId in line item");
      }

      return {
        price: item.stripe_id,
        quantity: item.quantity || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      line_items: lineItemsList,
      mode: "payment",
      invoice_creation: {
        enabled: true,
      },
      billing_address_collection: "required",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      automatic_tax: {
        enabled: true,
      },
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        userId: userId,
        cartItems: JSON.stringify(cartItemsList),
      },
    });

    return NextResponse.json({ session: session }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ statusCode: 500, message: error.message });
  }
}
