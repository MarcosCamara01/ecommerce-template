"use client";

import Link from "next/link";

import { openBag, useBagUi } from "@/components/bag/bag-ui";
import { useCart } from "@/hooks/cart";
import { cn } from "@/lib/utils";

const pill =
  "press flex items-center whitespace-nowrap rounded-pill bg-fg font-semibold text-bg";

/**
 * Ink "Bag · n" pill. On desktop it opens the bag drawer and is the landing
 * point for the add-to-bag flight; on phones it links to the bag page.
 */
export function BagLink({
  opensDrawer = false,
  className,
}: {
  opensDrawer?: boolean;
  className?: string;
}) {
  const { items, isSuccess } = useCart();
  const { bump } = useBagUi();
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const label = isSuccess
    ? `Bag, ${count} ${count === 1 ? "item" : "items"}`
    : "Bag";
  const text = (
    <span
      key={bump}
      aria-hidden="true"
      className={cn("inline-block", bump > 0 && "animate-bump")}
    >
      {isSuccess ? `Bag · ${count}` : "Bag"}
    </span>
  );

  if (opensDrawer) {
    return (
      <button
        type="button"
        data-bag-target=""
        aria-label={label}
        onClick={() => openBag()}
        className={cn(pill, className)}
      >
        {text}
      </button>
    );
  }

  return (
    <Link href="/cart" aria-label={label} className={cn(pill, className)}>
      {text}
    </Link>
  );
}
