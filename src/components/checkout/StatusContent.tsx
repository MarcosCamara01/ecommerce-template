import Link from "@/components/ui/link";

import type { CheckoutStatus } from "@/services/stripe.service";

import { AutoRefreshStatus } from "./AutoRefreshStatus";
import { checkoutStatusCopy } from "./checkout-copy";
import { ResultMessage, type ResultIcon } from "./ResultMessage";

type NonSuccessCheckoutStatus = Exclude<CheckoutStatus, "success">;

interface StatusContentProps {
  status: NonSuccessCheckoutStatus;
  sessionId: string;
  error?: string;
}

const STATUS_CONFIG: Record<
  NonSuccessCheckoutStatus,
  {
    icon: ResultIcon;
    title: string;
    message: string;
    showRetry: boolean;
  }
> = {
  expired: {
    icon: "clock",
    title: "Session Expired",
    message: "Your checkout session has expired. Your bag is still saved.",
    showRetry: true,
  },
  canceled: {
    icon: "cross",
    title: "Payment Canceled",
    message: "You canceled the payment. Your bag is still as you left it.",
    showRetry: true,
  },
  pending: {
    icon: "spin",
    title: "Payment Pending",
    message: "Your payment is being processed. This page will update automatically.",
    showRetry: false,
  },
  fulfillment_pending: {
    icon: "spin",
    ...checkoutStatusCopy("fulfillment_pending"),
    showRetry: false,
  },
  needs_attention: {
    icon: "alert",
    ...checkoutStatusCopy("needs_attention"),
    showRetry: false,
  },
  failed: {
    icon: "cross",
    title: "Payment Failed",
    message: "Your payment could not be processed. Please try again with a different payment method.",
    showRetry: true,
  },
  not_found: {
    icon: "alert",
    title: "Session Not Found",
    message: "This checkout session doesn't exist or has already been processed.",
    showRetry: false,
  },
  error: {
    icon: "alert",
    title: "Something Went Wrong",
    message: "We couldn't verify your payment status. Please check your email or orders page.",
    showRetry: false,
  },
};

export function StatusContent({ status, sessionId, error }: StatusContentProps) {
  const config = STATUS_CONFIG[status];
  const checking = status === "pending" || status === "fulfillment_pending";

  return (
    <>
      <AutoRefreshStatus active={checking} />
      <ResultMessage
        icon={config.icon}
        title={config.title}
        message={config.message}
        checking={checking}
        primary={
          config.showRetry
            ? { href: "/cart", label: "Return to cart" }
            : { href: "/orders", label: "Check orders" }
        }
        secondary={{ href: "/new-in", label: "Continue shopping" }}
        footnote={
          <div className="flex flex-col gap-1 text-sm text-muted">
            {config.showRetry ? (
              <Link href="/orders" className="self-start underline underline-offset-[3px]">
                Check orders
              </Link>
            ) : null}
            {error ? <p>Details: {error}</p> : null}
            {status === "error" || status === "failed" ? (
              <p>
                Reference: <span className="font-mono">{sessionId.slice(0, 20)}…</span>
              </p>
            ) : null}
          </div>
        }
      />
    </>
  );
}
