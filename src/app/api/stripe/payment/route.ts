import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

async function loadPrices() {
  const prices = await stripe.prices.list();
  return prices.data;
}

export async function POST(request: NextRequest) {
  try {
    const { lineItems, userId } = await request.json();

    if (!lineItems || !userId) throw Error("Missing data");

    const products = await loadPrices();

    const lineItemsList = await lineItems.map((item: any) => {
      const matchingProduct = products.find(
        (product) => product.id === item.variantId,
      );

      if (!matchingProduct) {
        throw new Error(`Product not found for variantId: ${item.variantId}`);
      }

      return {
        price: matchingProduct.id,
        quantity: item.quantity,
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
      },
    });

    return NextResponse.json({ session: session }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ statusCode: 500, message: error.message });
  }
}
