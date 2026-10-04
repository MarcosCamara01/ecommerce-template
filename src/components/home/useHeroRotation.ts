"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useHydrated } from "@/hooks/useHydrated";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** How long a piece stays up before the hero moves on to the next one. */
export const HERO_DWELL_MS = 6000;

/** A click this soon after an automatic change was aimed at the last piece. */
const MISCLICK_MS = 500;

/** Parts of the hero that hold the rotation while pointed at or focused. */
const HOLD = "[data-hero-hold]";

/** A piece's own controls: photo, name, size, add to bag. */
const CLAIM = "[data-hero-claim]";

const subscribeToVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

export const wrap = (value: number, count: number) =>
  ((value % count) + count) % count;

/**
 * The home hero as a carousel: the piece changes by itself every
 * HERO_DWELL_MS and the visitor can always take over.
 *
 * - It waits while the piece's details and quick add are pointed at or
 *   focused (not the photos: they fill the middle of the screen, where a
 *   resting pointer would hold it for no reason), while the hero is scrolled
 *   away, the tab is hidden or a dialog is open.
 * - Choosing a piece, a size or adding to the bag stops it for good; the
 *   toggle starts it again. Mark those controls with `data-hero-claim` and
 *   the areas that hold it with `data-hero-hold`.
 * - It never runs under reduced motion.
 */
export function useHeroRotation(
  count: number,
  /** The hero itself: the rotation waits while it is scrolled away. */
  regionRef: React.RefObject<HTMLElement | null>,
) {
  // `step` only counts up or down, never wraps, so every card keeps its own
  // place in the deck; `moves` counts changes and replays the entrance.
  const [{ step, moves }, setPosition] = useState({ step: 0, moves: 0 });
  const [stopped, setStopped] = useState(false);
  const [pointed, setPointed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(true);
  const hydrated = useHydrated();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pageVisible = useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
  const lastAutoMove = useRef(Number.NEGATIVE_INFINITY);

  const rotates = hydrated && count > 1 && !reducedMotion;
  const playing =
    rotates && !stopped && !pointed && !focused && inView && pageVisible;
  const index = wrap(step, count);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.intersectionRatio >= 0.5),
      { threshold: 0.5 },
    );
    observer.observe(region);
    return () => observer.disconnect();
  }, [regionRef]);

  // A click on the piece's own controls (`[data-hero-claim]`) stops the
  // rotation, and one that lands right after an automatic change is dropped:
  // it was aimed at the piece that just left. Listening in the capture phase
  // on the hero reaches the click before the control does.
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const claim = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(CLAIM)) return;
      setStopped(true);
      if (performance.now() - lastAutoMove.current < MISCLICK_MS) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    region.addEventListener("click", claim, true);
    return () => region.removeEventListener("click", claim, true);
  }, [regionRef]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      // An open dialog (search, menu, bag) covers the page: keep the piece
      // until it closes.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      lastAutoMove.current = performance.now();
      setPosition((current) => ({
        step: current.step + 1,
        moves: current.moves + 1,
      }));
    }, HERO_DWELL_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  const move = (delta: number) => {
    setStopped(true);
    if (delta === 0) return;
    setPosition((current) => ({
      step: current.step + delta,
      moves: current.moves + 1,
    }));
  };

  return {
    step,
    index,
    moves,
    /** Whether the hero rotates at all (more than one piece, motion allowed). */
    rotates,
    playing,
    stopped,
    /** Moves `delta` pieces on; the visitor took over, so the rotation stops. */
    shift: move,
    /** Shows the piece at `position`, going the shortest way round. */
    show: (position: number) => {
      const forward = wrap(position - index, count);
      move(forward * 2 <= count ? forward : forward - count);
    },
    toggle: () => setStopped((value) => !value),
    /** Spread on the hero region: holds the rotation over `[data-hero-hold]`. */
    hold: {
      onPointerOver: (event: React.PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        setPointed(
          event.target instanceof Element && event.target.closest(HOLD) !== null,
        );
      },
      onPointerLeave: () => setPointed(false),
      onFocus: (event: React.FocusEvent) =>
        setFocused(event.target.closest(HOLD) !== null),
      onBlur: (event: React.FocusEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      },
    },
  };
}
