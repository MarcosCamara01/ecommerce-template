"use client";

import { useState } from "react";

import { heroLetters } from "@/lib/hero-word";
import { cn } from "@/lib/utils";

/**
 * The hero's giant word. With `entrance` it rises letter by letter; once a
 * change of piece has played it keeps still, so a page re-shown from
 * <Activity> does not replay it.
 */
export function HeroWord({
  word,
  size,
  moves,
  entrance,
}: {
  word: string;
  size: { mobile: string; desktop: string };
  /** Changes of piece so far: each one is a new entrance. */
  moves: number;
  entrance: boolean;
}) {
  const [played, setPlayed] = useState<number | null>(null);
  const animate = entrance && played !== moves;

  return (
    <p
      aria-label={word}
      style={
        {
          "--word-m": size.mobile,
          "--word-d": size.desktop,
        } as React.CSSProperties
      }
      className="absolute inset-x-0 top-0 whitespace-nowrap text-center font-display text-[length:var(--word-m)] leading-[0.85] lg:static lg:text-[length:min(var(--word-d),calc(var(--hero-u)*316))] lg:leading-[0.82]"
    >
      <span
        key={moves}
        dir="auto"
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget.lastElementChild) setPlayed(moves);
        }}
        className="inline-flex overflow-hidden align-top"
      >
        {heroLetters(word).map((letter, position) => (
          <span
            key={position}
            aria-hidden="true"
            className={cn("inline-block whitespace-pre", animate && "animate-rise")}
            style={{ animationDelay: `${position * 28}ms` }}
          >
            {letter}
          </span>
        ))}
      </span>
    </p>
  );
}
