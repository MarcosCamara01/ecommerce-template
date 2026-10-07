import Link from "@/components/ui/link";
import { notFound } from "next/navigation";

import { SizeChart } from "@/components/help/SizeChart";
import { cn } from "@/lib/utils";

/**
 * Help topics. Merchant facts the store does not define (measurements,
 * delivery options, return window, support channel) stay as visible
 * placeholders: this template makes no commercial promise.
 */
const helpTopics = {
  "size-guide": {
    label: "Size guide",
    title: "Size guide",
    intro:
      "Three measurements, one chart. Measure over light clothing and compare with the chart below.",
  },
  delivery: {
    label: "Delivery",
    title: "Delivery",
    intro: "Delivery terms depend on the merchant, destination, and carrier configuration.",
  },
  returns: {
    label: "Returns & refunds",
    title: "Returns",
    intro: "Return eligibility and refund timing must come from an approved merchant policy.",
  },
} as const;

type HelpTopic = keyof typeof helpTopics;

const card = "flex flex-col gap-3.5 rounded-photo-lg border border-line bg-fg/[0.04] p-[22px]";
const inverted = "flex flex-wrap items-center gap-[18px] rounded-photo-lg bg-fg p-[22px] text-bg";

export function generateStaticParams() {
  return Object.keys(helpTopics).map((topic) => ({ topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const content = helpTopics[topic as HelpTopic];
  return { title: content ? `${content.title} | Ecommerce Template` : "Help | Ecommerce Template" };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const content = helpTopics[topic as HelpTopic];
  if (!content) notFound();

  return (
    <div className="flex flex-col gap-7 pb-24 pt-3 lg:pt-12">
      <section className="flex flex-col gap-[22px]">
        <nav
          aria-label="Help topics"
          className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0"
        >
          {(Object.keys(helpTopics) as HelpTopic[]).map((key) => (
            <Link
              key={key}
              href={`/help/${key}`}
              aria-current={key === topic ? "page" : undefined}
              className="press flex h-12 shrink-0 items-center rounded-pill border border-line px-5 font-medium aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg"
            >
              {helpTopics[key].label}
            </Link>
          ))}
        </nav>
        <h1 className="font-display text-[76px] leading-[0.82] lg:text-[min(200px,13vw)]">
          {content.title}
        </h1>
        <p className="max-w-[560px] text-[19px] leading-[1.45]">{content.intro}</p>
      </section>

      <section className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          {topic === "size-guide" ? <SizeGuide /> : null}
          {topic === "delivery" ? <Delivery /> : null}
          {topic === "returns" ? <Returns /> : null}
        </div>
        <aside className="flex flex-col gap-3.5 rounded-photo-lg bg-fg p-6 text-bg lg:sticky lg:top-[100px]">
          <h2 className="font-display text-[56px] leading-[0.88]">Still stuck?</h2>
          <p>Questions about an order or a fit? Reach the team on [SUPPORT CHANNEL].</p>
          <Link
            href="/orders"
            className="press grid h-[52px] place-items-center rounded-pill bg-bg font-semibold text-fg"
          >
            Check my orders
          </Link>
        </aside>
      </section>
    </div>
  );
}

const TEE = "M42 10 L28 14 L10 32 L22 44 L32 36 L32 84 L88 84 L88 36 L98 44 L110 32 L92 14 L78 10 Q60 22 42 10 Z";

const MEASURES = [
  {
    name: "Chest",
    how: "Around the fullest part of your chest, under your arms, tape level.",
    outline: TEE,
    tape: "M36 42 H84",
    ends: "M36 38 v8 M84 38 v8",
  },
  {
    name: "Waist",
    how: "Around your natural waistline, keeping one finger under the tape.",
    outline: "M36 8 H84 L90 84 H66 L60 34 L54 84 H30 Z",
    tape: "M32 16 H88",
    ends: "M32 12 v8 M88 12 v8",
  },
  {
    name: "Length",
    how: "From the highest point of the shoulder straight down to the hem.",
    outline: TEE,
    tape: "M60 16 V80",
    ends: "M56 16 h8 M56 80 h8",
  },
] as const;

const MEASURE_NAMES = MEASURES.map((measure) => measure.name);

function SizeGuide() {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
        {MEASURES.map((measure, index) => (
          <div key={measure.name} className={card}>
            <svg
              viewBox="0 0 120 90"
              className="h-[110px] w-full"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={measure.outline} />
              <path d={measure.tape} strokeDasharray="4 4" strokeWidth="2.4" />
              <path d={measure.ends} />
            </svg>
            <span className="font-display text-[40px] leading-[0.9]">
              {String(index + 1).padStart(2, "0")} {measure.name}
            </span>
            <span className="text-sm">{measure.how}</span>
          </div>
        ))}
      </div>
      <div className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">Size chart</h2>
          <span className="text-13">Body measurements in cm · tap your size</span>
        </div>
        <SizeChart rows={MEASURE_NAMES} />
      </div>
      <div className={inverted}>
        <h2 className="font-display text-[44px] leading-[0.9]">Between sizes?</h2>
        <p className="flex-[1_1_260px]">
          [FIT ADVICE — e.g. size down for a closer fit]. Each product page also
          shows its own fit note.
        </p>
      </div>
    </>
  );
}

const DELIVERY_OPTIONS = [
  { name: "Standard", time: "[X–Y business days]", price: "[PRICE]" },
  { name: "Express", time: "[X–Y business days]", price: "[PRICE]" },
] as const;

const TRACK = [
  ["Confirmed", "Payment received. A confirmation email is on its way."],
  ["Processing", "We are preparing and packing your order."],
  ["Shipped", "Handed to the carrier · [TRACKING DETAILS]."],
  ["Delivered", "At your door. Your order page shows the date."],
] as const;

function Delivery() {
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
        {DELIVERY_OPTIONS.map((option) => (
          <div key={option.name} className={cn(card, "gap-2.5")}>
            <span className="font-display text-[44px] leading-[0.9]">{option.name}</span>
            <span className="font-medium">{option.time}</span>
            <span className="mt-auto border-t border-line pt-3.5 text-[22px] font-semibold">
              {option.price}
            </span>
          </div>
        ))}
      </div>
      <div className={cn(card, "gap-4")}>
        <h2 className="text-xl font-semibold">Where your order is</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3.5">
          {TRACK.map(([label, body], index) => (
            <li key={label} className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className={cn("h-1.5 rounded-pill", index < 2 ? "bg-fg" : "bg-fg/25")}
              />
              <span className="font-semibold">{label}</span>
              <span className="text-sm">{body}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={cn(inverted, "justify-between")}>
        <h2 className="font-display text-[44px] leading-[0.9]">We ship to</h2>
        <span className="text-base font-medium">[COUNTRIES / REGIONS]</span>
      </div>
    </>
  );
}

const RETURN_STEPS = [
  ["Start a return", "[HOW — e.g. from your order page or by email to SUPPORT CHANNEL]"],
  ["Pack it up", "[CONDITION — e.g. unworn, with labels] and drop it at [CARRIER / ADDRESS]."],
  ["Get your refund", "[REFUND TIMELINE] after it is received, to [REFUND METHOD]."],
] as const;

function Returns() {
  return (
    <>
      <div className={cn(inverted, "items-end gap-5")}>
        <span className="font-display text-[120px] leading-[0.8] lg:text-[200px]">[N]</span>
        <div className="flex flex-col gap-1 pb-2">
          <h2 className="font-display text-[40px] leading-[0.9]">Days to return</h2>
          <p>From the day your order arrives · [RETURN WINDOW]</p>
        </div>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
        {RETURN_STEPS.map(([title, body], index) => (
          <li key={title} className={cn(card, "gap-2.5")}>
            <span className="font-display text-[64px] leading-[0.85]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-lg font-semibold">{title}</span>
            <span className="text-sm">{body}</span>
          </li>
        ))}
      </ol>
      <div className={cn(card, "gap-1.5")}>
        <h2 className="text-xl font-semibold">Can&apos;t be returned</h2>
        <p>[EXCLUSIONS — e.g. worn or washed items]</p>
      </div>
      <p className="text-sm text-muted">
        This starter does not create a return right or commit the merchant to a
        refund timeline.
      </p>
    </>
  );
}
