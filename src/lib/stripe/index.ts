import Stripe from "stripe";

import { createStripeClientOptions } from "./client-options";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  ...createStripeClientOptions(
    process.env.STRIPE_EMULATOR_URL,
    process.env.NODE_ENV,
  ),
});

export { Stripe };

