import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe must not crash Next.js during build-time route discovery when
 * credentials are not configured yet. The client is created normally when a
 * key exists; otherwise we expose a lazy proxy that throws only if a Stripe
 * operation is actually invoked at runtime.
 */
export const stripe: Stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
      telemetry: true,
    })
  : new Proxy({} as Stripe, {
      get() {
        throw new Error(
          "STRIPE_SECRET_KEY is not defined. Configure it before using Stripe-dependent features.",
        );
      },
    });

export { Stripe };
