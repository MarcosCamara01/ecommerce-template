"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";

/**
 * The store's link. The page behind it is fetched ahead when the visitor
 * shows intent (the pointer over it, keyboard focus, a finger down), not
 * when the link merely scrolls into view. A listing therefore does not ask
 * for every product page on screen, and a navigation still starts warm.
 *
 * Next's own prefetch is off and the router is asked directly, so the fetch
 * starts in the very event that showed the intent.
 */
export default function Link({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: Omit<React.ComponentProps<typeof NextLink>, "prefetch">) {
  const router = useRouter();
  const { href } = props;

  const fetchAhead = () => {
    if (typeof href === "string") router.prefetch(href);
  };

  return (
    <NextLink
      {...props}
      prefetch={false}
      onMouseEnter={(event) => {
        fetchAhead();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        fetchAhead();
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        fetchAhead();
        onTouchStart?.(event);
      }}
    />
  );
}
