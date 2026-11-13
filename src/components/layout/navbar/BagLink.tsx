"use client";

import Link from "@/components/ui/link";

import { openBag, useBagUi } from "@/components/bag/bag-ui";
import { RollingNumber } from "@/components/ui/rolling-number";
import { useCart } from "@/hooks/cart";
import { cn } from "@/lib/utils";

const pill =
  "press flex items-center whitespace-nowrap rounded-pill bg-fg font-semibold text-bg";

/**
 * On desktop the pill is where the add-to-bag flight lands: fly-to-bag.ts
 * finds it by `data-bag-target`.
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
      {isSuccess ? (
        <>
          {/* Past 99 the pill reads 99+, and a figure that does not change does not roll. */}
          Bag · <RollingNumber value={Math.min(count, 100)}>{count > 99 ? "99+" : count}</RollingNumber>
        </>
      ) : (
        "Bag"
      )}
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
