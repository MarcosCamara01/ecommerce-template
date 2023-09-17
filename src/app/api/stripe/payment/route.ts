import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-08-16"
});

export async function loadPrices() {
    const prices = await stripe.prices.list();
    return prices.data;
}

export async function POST(request: NextRequest) {

    try {
        const data = await request.json();
        const lineItems = data.lineItems;
        const userId = data.userId;

        const products = await loadPrices();

        const lineItemsList = await lineItems.map((item: any) => {
            const matchingProduct = products.find((product) => product.id === item.variantId);

            if (!matchingProduct) {
                throw new Error(`Producto no encontrado para el variantId: ${item.variantId}`);
            }

            return {
                price: matchingProduct.id,
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            line_items: lineItemsList,
            mode: "payment",
            billing_address_collection: "required",
            success_url: `http://localhost:3000/user/result?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: "http://localhost:3000/user/cart",
            automatic_tax: {
                enabled: true,
            },
            metadata: {
                userId: userId,
                products: JSON.stringify(lineItems),
            },
        });

        return NextResponse.json({ session: session }, { status: 200 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ statusCode: 500, message: error.message });
    }
}