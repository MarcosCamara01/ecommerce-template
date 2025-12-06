"use server";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }

    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-09-30.clover" as any,
    });
  }

  return stripeClient;
}

