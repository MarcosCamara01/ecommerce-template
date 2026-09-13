import type { CustomerEmailOutcome } from "@/lib/order-fulfillment";

const DURABLE_STATUS_COPY = {
  fulfillment_pending: {
    title: "Payment Received",
    message:
      "Your payment is confirmed. We’re preparing your order now, and this page will update automatically.",
  },
  needs_attention: {
    title: "Payment Received",
    message:
      "Your payment is safe, but your order needs review. No purchase information has been lost.",
  },
} as const;

const CUSTOMER_EMAIL_COPY: Record<CustomerEmailOutcome, string> = {
  queued: "Your confirmation email is queued and will be sent shortly.",
  delayed: "Email delivery is delayed, but your order is confirmed and safe.",
  sent: "A confirmation email has been sent with your order details and receipt.",
};

export function checkoutStatusCopy(
  status: keyof typeof DURABLE_STATUS_COPY,
) {
  return DURABLE_STATUS_COPY[status];
}

export function customerEmailMessage(status: CustomerEmailOutcome) {
  return CUSTOMER_EMAIL_COPY[status];
}
