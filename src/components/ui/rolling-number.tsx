"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A figure that rolls when it changes: the new one comes up from below when
 * it grew and down from above when it shrank (220ms ease-out). It answers
 * the click that changed it: a quantity, a line total, the total of the bag.
 *
 * `value` decides the direction; the children are what is shown (a formatted
 * price), or the value itself when there are none. Nothing rolls on the
 * first render.
 */
export function RollingNumber({
  value,
  children,
  className,
}: {
  value: number;
  children?: React.ReactNode;
  className?: string;
}) {
  // Kept from the render before, to know which way the figure went.
  const [seen, setSeen] = useState({ value, direction: 0 });
  let direction = seen.direction;
  if (seen.value !== value) {
    direction = value > seen.value ? 1 : -1;
    setSeen({ value, direction });
  }

  return (
    <span
      key={value}
      // Once played it is a plain figure again, so a page that comes back
      // on screen (back navigation) does not roll it a second time.
      onAnimationEnd={
        direction === 0
          ? undefined
          : () => setSeen((last) => ({ ...last, direction: 0 }))
      }
      style={
        direction === 0
          ? undefined
          : ({ "--roll": direction > 0 ? "45%" : "-45%" } as React.CSSProperties)
      }
      className={cn("inline-block", direction !== 0 && "animate-roll", className)}
    >
      {children ?? value}
    </span>
  );
}
