import { HiOutlineXCircle, HiOutlineClock, HiOutlineExclamation } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { CheckoutStatus } from "@/services/stripe.service";

interface StatusContentProps {
  status: CheckoutStatus;
  sessionId: string;
  error?: string;
}

const STATUS_CONFIG = {
  expired: {
    icon: HiOutlineClock,
    iconColor: "text-yellow-500",
    title: "Session Expired",
    message: "Your checkout session has expired. Items in your cart are still saved.",
    showRetry: true,
  },
  canceled: {
    icon: HiOutlineXCircle,
    iconColor: "text-gray-500",
    title: "Payment Canceled",
    message: "You canceled the payment. Your cart items are still available.",
    showRetry: true,
  },
  pending: {
    icon: HiOutlineClock,
    iconColor: "text-blue-500",
    title: "Payment Pending",
    message: "Your payment is being processed. This page will update automatically.",
    showRetry: false,
  },
  failed: {
    icon: HiOutlineXCircle,
    iconColor: "text-red-500",
    title: "Payment Failed",
    message: "Your payment could not be processed. Please try again with a different payment method.",
    showRetry: true,
  },
  not_found: {
    icon: HiOutlineExclamation,
    iconColor: "text-yellow-500",
    title: "Session Not Found",
    message: "This checkout session doesn't exist or has already been processed.",
    showRetry: false,
  },
  error: {
    icon: HiOutlineExclamation,
    iconColor: "text-red-500",
    title: "Something Went Wrong",
    message: "We couldn't verify your payment status. Please check your email or orders page.",
    showRetry: false,
  },
} as const;

export function StatusContent({ status, sessionId, error }: StatusContentProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  
  if (!config) return null;

  const Icon = config.icon;

  return (
    <>
      <div className="p-6 border border-solid rounded-lg bg-background-secondary border-border-primary">
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
          <h1 className="text-2xl font-bold sm:text-3xl">{config.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{config.message}</p>
        {error && (
          <p className="mt-2 text-xs text-muted-foreground/70">
            Details: {error}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {config.showRetry && (
          <Button asChild className="gap-2">
            <Link href="/cart">Return to Cart</Link>
          </Button>
        )}
        <Button asChild variant={config.showRetry ? "outline" : "default"} className="gap-2">
          <Link href="/orders">Check Orders</Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>

      {(status === "error" || status === "failed") && (
        <div className="p-3 border border-solid rounded-lg bg-background-tertiary border-border-primary">
          <p className="text-xs text-muted-foreground">
            Reference: <span className="font-mono">{sessionId.slice(0, 20)}...</span>
          </p>
        </div>
      )}
    </>
  );
}
