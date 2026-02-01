import {
  HiOutlineCheckCircle,
  HiOutlineMail,
  HiOutlineTruck,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineHome,
} from "react-icons/hi";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SuccessHeader() {
  return (
    <div className="p-6 border border-solid rounded-lg bg-background-secondary border-border-primary">
      <div className="flex items-center gap-3 mb-3">
        <HiOutlineCheckCircle className="w-8 h-8" />
        <h1 className="text-2xl font-bold sm:text-3xl">Payment Successful!</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Thank you for your purchase. Your order has been confirmed and will be
        processed shortly.
      </p>
    </div>
  );
}

export function OrderInfo() {
  return (
    <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
      <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
        <HiOutlineShoppingBag className="w-5 h-5" />
        Order Information
      </h3>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-500">
          Confirmed
        </span>
      </div>
    </div>
  );
}

export function EmailConfirmation({ email }: { email: string }) {
  return (
    <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
      <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
        <HiOutlineMail className="w-5 h-5" />
        Email Confirmation
      </h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <HiOutlineMail className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium break-all">{email}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to the address above with your
          order details and receipt.
        </p>
      </div>
    </div>
  );
}

const TIMELINE_STEPS = [
  { label: "Order Confirmed", time: "Just now", active: true },
  { label: "Processing", time: "1-2 business days", active: false },
  { label: "Shipped", time: "2-3 business days", active: false },
  { label: "Delivered", time: "5-7 business days", active: false },
] as const;

export function DeliveryTimeline() {
  return (
    <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
      <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
        <HiOutlineTruck className="w-5 h-5" />
        Delivery Timeline
      </h3>

      <div className="relative pl-6 space-y-4">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border-primary" />

        {TIMELINE_STEPS.map((step, index) => (
          <TimelineStep key={index} {...step} />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border-primary flex items-center gap-2">
        <HiOutlineClock className="w-4 h-4 shrink-0" />
        <p className="text-xs text-muted-foreground">
          You will receive tracking information via email once your order has
          been shipped.
        </p>
      </div>
    </div>
  );
}

function TimelineStep({ label, time, active }: { label: string; time: string; active: boolean }) {
  return (
    <div className="relative flex items-start gap-4">
      <div
        className={`absolute -left-6 w-4 h-4 rounded-full border-4 border-background-secondary ${
          active ? "bg-green-500" : "bg-border-primary"
        }`}
      />
      <div>
        <p className={`font-medium text-sm ${active ? "" : "text-muted-foreground"}`}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

export function ActionButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button asChild variant="outline" className="gap-2">
        <Link href="/orders">
          <HiOutlineShoppingBag className="w-4 h-4" />
          View Orders
        </Link>
      </Button>
      <Button asChild className="gap-2">
        <Link href="/">
          <HiOutlineHome className="w-4 h-4" />
          Continue Shopping
        </Link>
      </Button>
    </div>
  );
}
