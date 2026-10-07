"use client";

import { useSyncExternalStore } from "react";

const PIECES = 36;
const noop = () => () => {};

const storageKey = (orderId: number) => `store:confetti:${orderId}`;

const seen = (orderId: number) => {
  try {
    return sessionStorage.getItem(storageKey(orderId)) !== null;
  } catch {
    return false;
  }
};

/**
 * Confetti in the colours of what was bought, once per order: it falls
 * 1.4–2.1s on the in-out curve, then the order is remembered for this
 * browser session. Never rendered with reduced motion (CSS hides it).
 */
export function Confetti({
  orderId,
  colours,
}: {
  orderId: number;
  colours: string[];
}) {
  // The server never renders confetti; the client decides after hydration.
  const alreadySeen = useSyncExternalStore(noop, () => seen(orderId), () => true);
  if (alreadySeen || colours.length === 0) return null;

  const remember = () => {
    try {
      sessionStorage.setItem(storageKey(orderId), "1");
    } catch {
      // Private mode: it may play again on reload, which is harmless.
    }
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[760px] overflow-hidden lg:h-[900px]"
      style={{ "--fall": "900px" } as React.CSSProperties}
    >
      {Array.from({ length: PIECES }, (_, index) => {
        // Deterministic scatter so every visit to the same order matches.
        const r1 = ((index * 37) % 100) / 100;
        const r2 = ((index * 53) % 100) / 100;
        const r3 = ((index * 71) % 100) / 100;
        return (
          <span
            key={index}
            onAnimationEnd={index === PIECES - 1 ? remember : undefined}
            className="absolute top-0 animate-fall rounded-[3px]"
            style={
              {
                left: `${Math.round(r1 * 98)}%`,
                width: 6 + Math.round(r2 * 6),
                height: 10 + Math.round(r3 * 8),
                background: colours[index % colours.length],
                "--dx": `${Math.round((r2 - 0.5) * 160)}px`,
                "--rot": `${Math.round(180 + r3 * 540)}deg`,
                "--dur": `${1400 + Math.round(r1 * 700)}ms`,
                "--delay": `${Math.round(r3 * 350)}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
