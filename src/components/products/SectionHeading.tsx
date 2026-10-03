import { fitDisplaySize } from "@/lib/display-type";

/**
 * Giant section title sized to its own word (phones: up to 120px across
 * 358px; desktop: up to 240px, or 69vw of the word's width) with the piece
 * count beside it.
 */
export function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: React.ReactNode;
}) {
  const style = {
    "--title-m": fitDisplaySize(title, { maxPx: 120, budgetPx: 358, vwBudget: 92 }),
    "--title-d": fitDisplaySize(title, { maxPx: 240, budgetPx: 1000, vwBudget: 69 }),
  } as React.CSSProperties;

  return (
    <div className="flex items-end justify-between gap-2 pt-2 lg:gap-6 lg:pt-10">
      <h1
        style={style}
        className="whitespace-nowrap font-display text-[length:var(--title-m)] leading-[0.8] lg:text-[length:var(--title-d)]"
      >
        {title}
      </h1>
      {count}
    </div>
  );
}

export function SectionCount({ count }: { count: number }) {
  return (
    <span className="whitespace-nowrap pb-1.5 font-display text-[28px] font-extrabold normal-case leading-none tabular-nums lg:pb-3 lg:text-[56px]">
      {String(count).padStart(2, "0")}
      <span className="opacity-65 max-lg:sr-only"> pieces</span>
    </span>
  );
}
