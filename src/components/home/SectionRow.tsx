"use client";

import Link from "@/components/ui/link";
import { useRef } from "react";

import { ArrowUpRightIcon } from "@/components/icons";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Edge = "top" | "bottom";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const POUR_IN_MS = 450;
const POUR_OUT_MS = 350;

/** The ink fully gathered against one edge of the row. */
const gathered = (edge: Edge) =>
  edge === "top" ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)";

/** Which edge of the row the pointer is nearer: the one it just crossed. */
const edgeOf = (event: React.PointerEvent<HTMLElement>): Edge => {
  const box = event.currentTarget.getBoundingClientRect();
  return event.clientY < box.top + box.height / 2 ? "top" : "bottom";
};

/**
 * An edge-to-edge section row in giant type whose ink follows the pointer:
 * it pours in from the edge the pointer crossed, turning the row to ink with
 * ground-coloured type, and drains through the edge it leaves by. Moving
 * down the list, the ink travels with the pointer. The word shifts a little
 * and the arrow flies out as a new one comes in.
 *
 * The inked row is a second copy of the content, clipped: the type stays
 * crisp and in the exact theme colours while the edge passes over it. The
 * clip is driven with WAAPI so a change of direction carries on from where
 * the ink is. Mouse only; keyboard focus inks the row with a transition.
 */
export function SectionRow({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  const inkRef = useRef<HTMLSpanElement>(null);
  const pourRef = useRef<Animation | null>(null);

  const pour = (row: HTMLElement, to: string, from: string | null, ms: number) => {
    const ink = inkRef.current;
    if (!ink) return;
    // Carry on from wherever the ink is if it is still moving.
    const start = pourRef.current ? getComputedStyle(ink).clipPath : from;
    pourRef.current?.cancel();
    const animation = ink.animate(
      { clipPath: start ? [start, to] : [to] },
      {
        duration: prefersReducedMotion() ? 0 : ms,
        easing: EASE_OUT,
        fill: "forwards",
      },
    );
    pourRef.current = animation;
    row.dataset.inked = String(to === "inset(0)");
    return animation;
  };

  const content = (inked: boolean) => (
    <span className="flex items-center justify-between gap-4 px-4 py-2 lg:px-8">
      <span className="font-display text-[min(190px,13.2vw)] leading-[0.92] transition-transform duration-450 ease-out group-data-[inked=true]:translate-x-3 motion-reduce:transition-none motion-reduce:group-data-[inked=true]:translate-x-0">
        {label}
      </span>
      <span className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm lg:gap-4 lg:text-[15px]">
        {/* Phones only have room for the word and the arrow. */}
        <span className="max-sm:sr-only">{String(count).padStart(2, "0")} styles</span>
        <span
          className={cn(
            "relative grid size-11 place-items-center overflow-hidden rounded-pill border lg:size-16",
            inked ? "border-bg" : "border-fg",
          )}
        >
          {/* One arrow leaves through the corner it points at, the next arrives. */}
          <ArrowUpRightIcon className="transition-transform duration-350 ease-out group-data-[inked=true]:-translate-y-[220%] group-data-[inked=true]:translate-x-[220%] motion-reduce:transition-none" />
          <ArrowUpRightIcon className="absolute -translate-x-[220%] translate-y-[220%] transition-transform duration-350 ease-out group-data-[inked=true]:translate-x-0 group-data-[inked=true]:translate-y-0 motion-reduce:transition-none" />
        </span>
      </span>
    </span>
  );

  return (
    <Link
      href={href}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        pour(event.currentTarget, "inset(0)", gathered(edgeOf(event)), POUR_IN_MS);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        const drained = pour(event.currentTarget, gathered(edgeOf(event)), null, POUR_OUT_MS);
        // Once drained, hand the clip back to the stylesheet.
        drained?.finished.then(
          () => {
            if (pourRef.current !== drained) return;
            drained.cancel();
            pourRef.current = null;
          },
          () => {},
        );
      }}
      className="group relative block overflow-hidden border-b border-line"
    >
      {content(false)}
      <span
        ref={inkRef}
        aria-hidden="true"
        className="absolute inset-0 bg-fg text-bg transition-[clip-path] duration-350 ease-out [clip-path:inset(100%_0_0_0)] group-focus-visible:[clip-path:inset(0)] motion-reduce:transition-none"
      >
        {content(true)}
      </span>
    </Link>
  );
}
