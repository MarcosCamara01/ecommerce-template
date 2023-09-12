import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

export async function loadPrices() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const prices = await stripe.prices.list();
    return prices.data;
}

export async function POST(request) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
        const data = await request.json();
        let lineItems = data.lineItems;

        const products = await loadPrices();

        const lineItemsList = await lineItems.map((item) => {
            const matchingProduct = products.find((product) => product.nickname === item.productId);

            if (!matchingProduct) {
                throw new Error(`Producto no encontrado para el productId: ${item.productId}`);
            }

            return {
                price: matchingProduct.id,
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            line_items: lineItemsList,
            mode: "payment",
            success_url: "http://localhost:3000",
            cancel_url: "http://localhost:3000/user/cart",
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error(error);
        return NextResponse.error("Error al procesar la solicitud", 500);
    }
}
