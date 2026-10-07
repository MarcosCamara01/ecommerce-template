"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

import {
  counterTransform,
  drawnBox,
  inversion,
  layoutBox,
  parseMatrix,
  sameBox,
  toTransform,
  type Box,
} from "@/lib/flip";
import { EASE_DRAWER, EASE_OUT, prefersReducedMotion } from "@/lib/motion";

/** How long a piece takes to reach its new place, on the drawer curve. */
const GLIDE_MS = 500;
const GLIDE_EASING = `cubic-bezier(${EASE_DRAWER.join(", ")})`;

/** Each piece sets off a little after the one before; the tenth waits longest. */
const STAGGER_MS = 20;
const STAGGERED = 10;

/** A piece that was not there before rises into place. */
const ENTER_MS = 400;
const ENTER_EASING = `cubic-bezier(${EASE_OUT.join(", ")})`;

const ITEM = "[data-flip-item]";
const PARTS = '[data-flip-part="morph"], [data-flip-part="move"]';
const KEPT = '[data-flip-part="keep"]';

type Part = {
  element: HTMLElement;
  key: string;
  mode: "morph" | "move";
  item: HTMLElement;
};

/** The flight each element is on, so a new one can take over from it. */
const flights = new WeakMap<HTMLElement, Animation>();

const sizeOf = (element: HTMLElement) =>
  `${element.offsetWidth}x${element.offsetHeight}`;

function partsOf(container: HTMLElement): Part[] {
  const parts: Part[] = [];
  for (const item of Array.from(container.querySelectorAll<HTMLElement>(ITEM))) {
    const id = item.dataset.flipItem ?? "";
    const own = Array.from(item.querySelectorAll<HTMLElement>(PARTS));
    // An item with no parts of its own moves as one piece.
    if (own.length === 0) {
      parts.push({ element: item, key: id, mode: "morph", item });
      continue;
    }
    own.forEach((element, index) => {
      const mode = element.dataset.flipPart === "move" ? "move" : "morph";
      parts.push({ element, key: `${id}/${index}`, mode, item });
    });
  }
  return parts;
}

function fly(
  element: HTMLElement,
  keyframes: Keyframe[],
  timing: KeyframeAnimationOptions,
  origin = "0 0",
) {
  flights.get(element)?.cancel();
  element.style.transformOrigin = origin;
  const flight = element.animate(keyframes, { fill: "backwards", ...timing });
  flights.set(element, flight);
  const land = () => {
    // A newer flight owns the element now: leave its origin alone.
    if (flights.get(element) !== flight) return;
    flights.delete(element);
    element.style.transformOrigin = "";
  };
  flight.finished.then(land, land);
}

/**
 * The point a kept element scales about: the corner of the tile it sits
 * nearest, so it keeps its distance from that corner as well as its size.
 */
function pinOf(kept: HTMLElement, tile: HTMLElement) {
  if (kept.offsetParent !== tile) return "50% 50%";
  const right = kept.offsetLeft + kept.offsetWidth / 2 > tile.clientWidth / 2;
  const bottom = kept.offsetTop + kept.offsetHeight / 2 > tile.clientHeight / 2;
  const x = (right ? tile.clientWidth : 0) - kept.offsetLeft;
  const y = (bottom ? tile.clientHeight : 0) - kept.offsetTop;
  return `${x}px ${y}px`;
}

/** Drops an element, and what it keeps to size, where the layout has them. */
function ground(element: HTMLElement) {
  flights.get(element)?.cancel();
  element
    .querySelectorAll<HTMLElement>(KEPT)
    .forEach((kept) => flights.get(kept)?.cancel());
}

/**
 * Measures the container's pieces and, given where they were (`memory`),
 * sends the ones that changed place gliding from there. Returns where they
 * are now, to remember for the next change.
 */
function flip(container: HTMLElement, memory: Map<string, Box> | null) {
  const base = container.getBoundingClientRect();
  const boxes = new Map<string, Box>();
  const moved: { part: Part; from: Box; to: Box }[] = [];
  const entered = new Set<HTMLElement>();

  for (const part of partsOf(container)) {
    // A piece may still be in flight: its transform tells its layout box
    // from where it is drawn, which is where the next flight must start.
    const matrix = parseMatrix(getComputedStyle(part.element).transform);
    const rect = part.element.getBoundingClientRect();
    const to = layoutBox(
      {
        left: rect.left - base.left,
        top: rect.top - base.top,
        width: rect.width,
        height: rect.height,
      },
      matrix,
    );
    boxes.set(part.key, to);
    if (!memory) continue;
    const before = memory.get(part.key);
    if (!before) entered.add(part.item);
    else if (!sameBox(before, to)) {
      moved.push({ part, from: drawnBox(before, matrix), to });
    }
  }
  if (!memory) return boxes;

  const reduced = prefersReducedMotion();
  // Only what passes through the screen is worth moving.
  const top = -base.top;
  const bottom = window.innerHeight - base.top;
  const onScreen = (box: Box) => box.top < bottom && box.top + box.height > top;
  const order = new Map<HTMLElement, number>();
  const turn = (item: HTMLElement) => {
    if (!order.has(item)) order.set(item, order.size);
    return Math.min(order.get(item) ?? 0, STAGGERED) * STAGGER_MS;
  };

  for (const { part, from, to } of moved) {
    const invert =
      !reduced && (onScreen(from) || onScreen(to))
        ? inversion(from, to, part.mode)
        : null;
    if (!invert) {
      ground(part.element);
      continue;
    }
    const timing = {
      duration: GLIDE_MS,
      // A piece already in flight turns round at once: waiting its turn
      // would freeze it mid-air.
      delay: flights.has(part.element) ? 0 : turn(part.item),
      easing: GLIDE_EASING,
    };
    fly(
      part.element,
      [{ transform: toTransform(invert) }, { transform: "none" }],
      timing,
    );
    if (invert.scaleX === 1 && invert.scaleY === 1) continue;
    part.element.querySelectorAll<HTMLElement>(KEPT).forEach((kept) =>
      fly(
        kept,
        [{ transform: counterTransform(invert) }, { transform: "none" }],
        timing,
        pinOf(kept, part.element),
      ),
    );
  }

  entered.forEach((item) =>
    fly(
      item,
      reduced
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "none" },
          ],
      {
        duration: reduced ? 200 : ENTER_MS,
        delay: turn(item),
        easing: ENTER_EASING,
      },
    ),
  );

  return boxes;
}

/**
 * Makes a container's pieces glide when they change place: a grid going from
 * three columns to four, a list re-sorted or filtered, the gap a removed
 * item leaves. Returns the ref for the container.
 *
 * Inside it, mark each piece with `data-flip-item={id}`. A piece moves as
 * one, unless it marks parts of its own with `data-flip-part`:
 *
 * - `morph`: follows its box in place and size (a photo tile);
 * - `move`: follows its corner only, so text never stretches;
 * - `keep`, inside a `morph`: keeps its own size while the tile scales, and
 *   its distance from the corner it sits by (the heart on a photo).
 *
 * Flights are WAAPI transforms (500ms, drawer curve, 20ms apart), so they
 * stay smooth while photos load, and a change mid-flight carries on from
 * where each piece is. Pieces that were not there before rise in; ones that
 * leave just go. Reduced motion keeps the fade of new pieces and drops the
 * rest. Marked parts must not carry transforms of their own.
 */
export function useFlip<T extends HTMLElement>() {
  const node = useRef<T | null>(null);
  const memory = useRef<Map<string, Box> | null>(null);
  // The container's size when its pieces were last measured.
  const measured = useRef("");

  // After every render of the host: nothing happens unless a piece moved.
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    memory.current = flip(element, memory.current);
    measured.current = sizeOf(element);
  });

  return useCallback((element: T | null) => {
    node.current = element;
    memory.current = null;
    if (!element) return;
    // The page can lay the container out again with no render: the window
    // resized, a font arrived. Flights would land in the wrong place and the
    // next change would start from places long gone, so drop them and
    // remember the layout as it is now.
    const observer = new ResizeObserver(() => {
      const size = sizeOf(element);
      if (size === measured.current) return;
      measured.current = size;
      for (const part of partsOf(element)) ground(part.element);
      memory.current = flip(element, null);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      node.current = null;
    };
  }, []);
}
