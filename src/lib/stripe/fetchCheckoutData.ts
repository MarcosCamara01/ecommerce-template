import Stripe from "stripe";

export const fetchCheckoutData = async (
  sessionId: string
): Promise<Stripe.Checkout.Session | undefined> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout_sessions?session_id=${sessionId}`
    ).then((res) => res.json());
    return response;
  } catch (err: any) {
    console.error("Error obtaining data:", err.message);
  }
};

