"use client";

import { useState } from "react";

/**
 * Marks its subtree played once every CSS animation inside it has ended,
 * so a page re-shown from <Activity> (back navigation) does not replay its
 * entrance: globals.css drops the classes under [data-played].
 */
export function PlayOnce({ children }: { children: React.ReactNode }) {
  const [played, setPlayed] = useState(false);
  return (
    <div
      className="contents"
      data-played={played ? "" : undefined}
      onAnimationEnd={(event) => {
        if (played) return;
        const busy = event.currentTarget
          .getAnimations({ subtree: true })
          .some((animation) => animation instanceof CSSAnimation && animation.playState === "running");
        if (!busy) setPlayed(true);
      }}
    >
      {children}
    </div>
  );
}
