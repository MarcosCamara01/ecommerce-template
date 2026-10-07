import Image from "next/image";
import Link from "@/components/ui/link";
import { format } from "date-fns";

import { buttonClass } from "@/components/ui/button-classes";
import { OrderSteps } from "@/components/orders/OrderSteps";
import { swatchBackground } from "@/constants/colors";
import { merchantPlaceholders } from "@/constants/merchant";
import type { OrderWithDetails } from "@/lib/db/drizzle/schema";
import type { CustomerEmailOutcome } from "@/lib/order-fulfillment";
import { heroWord } from "@/lib/hero-word";
import { orderViewModel } from "@/lib/orders/view-model";

import { customerEmailMessage } from "./checkout-copy";
import { Confetti } from "./Confetti";

const THANK_YOU = ["THANK", "YOU."];

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/**
 * Order success: confetti in the colours bought (once per order), the
 * title rising letter by letter (35ms apart), the pieces arriving as tiles.
 */
export function SuccessContent({
  orderId,
  order,
  email,
  emailStatus,
}: {
  orderId: number;
  order: OrderWithDetails | null;
  email?: string | null;
  emailStatus: CustomerEmailOutcome;
}) {
  const view = order ? orderViewModel(order) : null;
  const lines = order?.orderProducts ?? [];
  const colours = Array.from(new Set(lines.map((line) => swatchBackground(line.variantColor))));

  return (
    <div className="relative flex flex-col gap-6 pb-10 pt-2 lg:gap-10 lg:pb-20 lg:pt-6">
      <Confetti orderId={orderId} colours={colours} />

      <div className="flex flex-col gap-3.5">
        <span className="flex items-center gap-2.5 font-medium">
          <span className="grid size-7 place-items-center rounded-pill bg-fg text-bg">
            <CheckIcon />
          </span>
          <span>
            Payment successful
            {order ? ` · Order #${order.orderNumber}` : null}
          </span>
        </span>
        <p
          aria-label="Thank you."
          className="font-display text-[96px] leading-[0.8] lg:text-[min(300px,21vw)]"
        >
          {THANK_YOU.map((word, wordIndex) => (
            <span key={word} className="mr-[0.22em] inline-flex overflow-hidden align-top">
              {word.split("").map((letter, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="inline-block animate-rise"
                  style={{ animationDelay: `${(wordIndex * 6 + index) * 35}ms` }}
                >
                  {letter}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p className="max-w-[520px] text-[17px]">
          {email ? (
            <>
              {customerEmailMessage(emailStatus)}{" "}
              <span className="text-muted">({email})</span>
            </>
          ) : (
            "Thank you for your purchase. Your order has been confirmed and will be processed shortly."
          )}
        </p>
      </div>

      {lines.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5">
          {lines.slice(0, 3).map((line, index) => (
            <figure
              key={line.id}
              className="flex animate-tile flex-col overflow-hidden rounded-photo bg-field"
              style={{ animationDelay: `${420 + index * 80}ms` }}
            >
              <Image
                src={line.imageUrl}
                alt={line.productName}
                width={480}
                height={360}
                sizes="(max-width: 1023px) 33vw, 30vw"
                className="aspect-[3/4] w-full bg-photo object-cover lg:aspect-[4/3]"
              />
              <figcaption className="flex flex-col px-3.5 py-3 text-13 leading-tight">
                <span className="font-semibold">{line.variantColor}</span>
                <span className="text-muted">{heroWord(line.productName)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5 rounded-photo border border-line p-5">
          <h2 className="font-semibold">Status</h2>
          <OrderSteps
            step={1}
            notes={[
              "Just now",
              "Next",
              "—",
              view
                ? `Est. ${format(view.deliveryDate, "MMM d")}`
                : merchantPlaceholders.deliveryEstimate,
            ]}
          />
        </div>
        <div className="flex flex-col gap-2.5 rounded-photo border border-line p-5">
          {view ? (
            <div className="flex items-baseline justify-between tabular-nums">
              <span className="text-muted">
                {view.totalItems} {view.totalItems === 1 ? "item" : "items"}
              </span>
              <span className="font-display-75 text-[28px] font-extrabold leading-none">
                {view.totalPrice}
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link href={`/orders/${orderId}`} className={buttonClass({ size: "sm", className: "h-[52px] grow" })}>
              View order
            </Link>
            <Link
              href="/new-in"
              className={buttonClass({ variant: "secondary", size: "sm", className: "h-[52px] grow" })}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
