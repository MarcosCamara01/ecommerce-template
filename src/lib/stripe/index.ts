import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover" as any,
});

export { fetchCheckoutData } from "./fetchCheckoutData";
export { processCompletedOrder } from "./processCompletedOrder";
