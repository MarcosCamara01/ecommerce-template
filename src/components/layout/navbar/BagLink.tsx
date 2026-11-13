"use client";

import { useEffect, useRef, useState } from "react";

import Link from "@/components/ui/link";

import { openBag, useBagUi } from "@/components/bag/bag-ui";
import { RollingNumber } from "@/components/ui/rolling-number";
import { useCart } from "@/hooks/cart";
import { cssEase, EASE_IN_OUT, EASE_OUT, prefersReducedMotion } from "@/lib/motion";
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
  const { bump, held } = useBagUi();
  const count = items.reduce((total, item) => total + item.quantity, 0);
  // While a photo flies here the pill keeps the count from before; it rolls as the photo lands.
  const [shown, setShown] = useState(count);
  if (!held && shown !== count) setShown(count);
  const bumpRef = useRef<HTMLSpanElement>(null);
  const lastBump = useRef(bump);
  useEffect(() => {
    if (bump === lastBump.current) return;
    lastBump.current = bump;
    const span = bumpRef.current;
    // The desktop pill and the phone bar both mount a BagLink; CSS hides one.
    if (!span || span.getClientRects().length === 0 || prefersReducedMotion()) return;
    // WAAPI, not a remount: a remount would reset the RollingNumber inside.
    span.animate(
      [
        { transform: "scale(1)", easing: cssEase(EASE_OUT) },
        { transform: "scale(1.2)", offset: 0.4, easing: cssEase(EASE_IN_OUT) },
        { transform: "scale(1)" },
      ],
      { duration: 320 },
    );
  }, [bump]);
  const label = isSuccess
    ? `Bag, ${count} ${count === 1 ? "item" : "items"}`
    : "Bag";
  const text = (
    <span ref={bumpRef} aria-hidden="true" className="inline-block tabular-nums">
      Bag
      {/* The count arrives after the session: the pill widens instead of
          snapping. A no-break space, or the slot's own line would drop it.
          Past 99 it reads 99+, and a figure that does not change does not roll. */}
      <span className="count-reveal" data-open={isSuccess}>
        <span>
          {" · "}
          {isSuccess ? (
            <RollingNumber value={Math.min(shown, 100)}>{shown > 99 ? "99+" : shown}</RollingNumber>
          ) : null}
        </span>
      </span>
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
