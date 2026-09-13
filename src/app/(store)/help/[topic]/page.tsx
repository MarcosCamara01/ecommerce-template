import { notFound } from "next/navigation";

const helpTopics = {
  "size-guide": {
    title: "Size Guide",
    intro: "Sizing guidance is merchant-provided content and must be configured before this storefront launches.",
    sections: [
      ["Product measurements", "Add the measurements and fit notes that apply to the products offered by this merchant."],
      ["Customer guidance", "Provide a verified support channel for questions when product-specific sizing is available."],
    ],
  },
  delivery: {
    title: "Delivery",
    intro: "Delivery terms depend on the merchant, destination, and carrier configuration.",
    sections: [
      ["Before launch", "Configure supported destinations, charges, processing expectations, and carrier responsibilities."],
      ["At checkout", "Show only delivery options and estimates supplied by the configured fulfillment provider."],
    ],
  },
  returns: {
    title: "Returns & Refunds",
    intro: "Return eligibility and refund timing must come from an approved merchant policy.",
    sections: [
      ["Policy required", "Publish jurisdiction-appropriate conditions, exclusions, instructions, and contact details before accepting orders."],
      ["No template promise", "This starter does not create a return right or commit the merchant to a refund timeline."],
    ],
  },
} as const;

type HelpTopic = keyof typeof helpTopics;

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
    <main className="mx-auto min-h-[60vh] w-full max-w-3xl px-6 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-balance">{content.title}</h1>
      <p className="mt-4 text-color-secondary text-pretty">{content.intro}</p>
      <div className="mt-10 space-y-8">
        {content.sections.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 leading-7 text-color-secondary">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
