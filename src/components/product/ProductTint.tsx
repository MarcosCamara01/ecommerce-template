"use client";

import { useLayoutEffect, useRef } from "react";

import type { Tint } from "@/lib/tint";

export type RevealOrigin = { x: number; y: number };

const REVEAL_MS = 650;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

// Text and surfaces follow the reveal on the same curve, but only once the
// visitor changes colour: the first paint arrives already tinted.
const vars = (tint: Tint, base: Tint, animate: boolean) => `
:root{--bg:${tint.light.bg};--fg:${tint.light.fg};--glass:${tint.glassLight};--tint-next:${tint.light.bg};--tint-base:${base.light.bg}${animate ? ";transition:--bg 600ms var(--ease-out),--fg 600ms var(--ease-out)" : ""}}
:root.dark{--bg:${tint.dark.bg};--fg:${tint.dark.fg};--glass:${tint.glassDark};--tint-next:${tint.dark.bg};--tint-base:${base.dark.bg}}
@media (prefers-reduced-motion:reduce){:root{transition-duration:200ms}}`;

/**
 * Tints the whole page with the selected variant (the Earned Colour Rule).
 *
 * The inline <style> sets --bg/--fg on :root, so the navigation, text and
 * surfaces transition with them (registered with @property). Behind the
 * page, two fixed layers do the reveal: the previous colour, and the new one
 * growing as a circle from the swatch that was tapped. The style element
 * unmounts with the page, so no other route is ever tinted.
 */
export function ProductTint({
  tint,
  base,
  origin,
  onSettled,
}: {
  /** The colour being shown. */
  tint: Tint;
  /** The colour it grows over; equal to `tint` once settled. */
  base: Tint;
  /** Where the change came from; null for the first paint. */
  origin: RevealOrigin | null;
  onSettled: () => void;
}) {
  const revealRef = useRef<HTMLDivElement>(null);
  const settling = base !== tint;

  useLayoutEffect(() => {
    const layer = revealRef.current;
    if (!layer || !settling || !origin) return;

    const radius = Math.hypot(
      Math.max(origin.x, innerWidth - origin.x),
      Math.max(origin.y, innerHeight - origin.y),
    );
    const animation = layer.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      { duration: REVEAL_MS, easing: EASE_OUT },
    );
    animation.onfinish = onSettled;
    // A newer pick cancels this reveal; the parent makes it the new base.
    return () => animation.cancel();
  }, [settling, origin, onSettled]);

  return (
    <>
      <style>{vars(tint, base, origin !== null)}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--tint-base)] transition-[background-color] duration-200 ease-out"
      />
      <div
        ref={revealRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--tint-next)] motion-reduce:transition-[background-color] motion-reduce:duration-200"
        style={{ clipPath: settling ? "circle(0px at 50% 50%)" : undefined }}
      />
    </>
  );
}
