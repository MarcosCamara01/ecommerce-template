"use client";

import NextLink from "next/link";
import { useState } from "react";

/**
 * The store's link. The page behind it is fetched ahead when the visitor
 * shows intent (the pointer over it, keyboard focus, a finger down), not
 * when the link merely scrolls into view. A listing therefore does not ask
 * for every product page on screen, and a navigation still starts warm.
 *
 * `prefetch` decides otherwise: the sections of the navigation pass "auto"
 * and are fetched as soon as they show, as Next does by default.
 */
export default function Link({
  prefetch,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: React.ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false);

  return (
    <NextLink
      {...props}
      prefetch={prefetch ?? (intent ? null : false)}
      onMouseEnter={(event) => {
        setIntent(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
}
