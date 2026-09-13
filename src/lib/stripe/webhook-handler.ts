import Stripe from "stripe";

type StripeWebhookRequest = Pick<Request, "headers" | "text">;

type StripeWebhookDependencies = Readonly<{
  getWebhookSecret: () => string | undefined;
  constructEvent: (
    payload: string,
    signature: string,
    secret: string,
  ) => Stripe.Event;
  registerEvent: (
    event: Stripe.Event,
  ) => Promise<{ handled: boolean }>;
  logger: Readonly<{
    warn: (message: string) => void;
    error: (message: string, error: unknown) => void;
  }>;
}>;

export function createStripeWebhookHandler(
  dependencies: StripeWebhookDependencies,
) {
  return async function handleStripeWebhook(request: StripeWebhookRequest) {
    try {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        dependencies.logger.warn("Webhook signature is missing");
        return Response.json(
          { error: "Webhook signature is required" },
          { status: 400 },
        );
      }

      const secret = dependencies.getWebhookSecret();
      if (!secret) {
        const configurationError = new Error(
          "STRIPE_WEBHOOK_SECRET is not configured",
        );
        dependencies.logger.error(
          "Webhook secret is not configured",
          configurationError,
        );
        return Response.json(
          { error: "Webhook is not configured" },
          { status: 500 },
        );
      }

      const event = dependencies.constructEvent(
        await request.text(),
        signature,
        secret,
      );
      const result = await dependencies.registerEvent(event);
      return Response.json({ received: true, processed: result.handled });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        dependencies.logger.warn("Webhook signature verification failed");
        return Response.json(
          { error: "Webhook signature verification failed" },
          { status: 400 },
        );
      }

      dependencies.logger.error("Webhook registration failed", error);
      return Response.json(
        { error: "Webhook registration failed" },
        { status: 500 },
      );
    }
  };
}
