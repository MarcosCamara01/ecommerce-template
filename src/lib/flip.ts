/**
 * The geometry of FLIP (first, last, invert, play): when a layout changes,
 * each element is drawn back where it was with a transform and that
 * transform is animated away, so it glides to its new place instead of
 * jumping there. All transforms here are about the element's top-left
 * corner (`transform-origin: 0 0`), which keeps the sums below simple.
 *
 * `useFlip` plays these on the page; this file only does the sums.
 */
export type Box = { left: number; top: number; width: number; height: number };

/** The scale (a, d) and translation (e, f) of a 2D transform. */
export type Matrix = { a: number; d: number; e: number; f: number };

export const IDENTITY: Matrix = { a: 1, d: 1, e: 0, f: 0 };

/** Reads the computed `transform` of an element: `none` or `matrix(...)`. */
export function parseMatrix(value: string): Matrix {
  const match = /^matrix\(([^)]+)\)$/.exec(value.trim());
  if (!match) return IDENTITY;
  const [a, , , d, e, f] = match[1].split(",").map(Number);
  if (![a, d, e, f].every(Number.isFinite) || a === 0 || d === 0) return IDENTITY;
  return { a, d, e, f };
}

/** Where a box is drawn while a transform applies to it. */
export function drawnBox(box: Box, matrix: Matrix): Box {
  return {
    left: box.left + matrix.e,
    top: box.top + matrix.f,
    width: box.width * matrix.a,
    height: box.height * matrix.d,
  };
}

/** The layout box behind a drawn one: `drawnBox` undone. */
export function layoutBox(drawn: Box, matrix: Matrix): Box {
  return {
    left: drawn.left - matrix.e,
    top: drawn.top - matrix.f,
    width: drawn.width / matrix.a,
    height: drawn.height / matrix.d,
  };
}

/** Same place and size, to within half a pixel. */
export function sameBox(first: Box, second: Box): boolean {
  return (
    Math.abs(first.left - second.left) < 0.5 &&
    Math.abs(first.top - second.top) < 0.5 &&
    Math.abs(first.width - second.width) < 0.5 &&
    Math.abs(first.height - second.height) < 0.5
  );
}

export type Inversion = { x: number; y: number; scaleX: number; scaleY: number };

/**
 * The transform that draws an element laid out at `to` where `from` is.
 * `morph` also takes the size of `from`; `move` only follows its corner,
 * for text, which must not stretch. Null when there is nothing to undo.
 */
export function inversion(
  from: Box,
  to: Box,
  mode: "morph" | "move",
): Inversion | null {
  const morphs = mode === "morph" && to.width > 0 && to.height > 0;
  const invert = {
    x: from.left - to.left,
    y: from.top - to.top,
    scaleX: morphs ? from.width / to.width : 1,
    scaleY: morphs ? from.height / to.height : 1,
  };
  const still =
    Math.abs(invert.x) < 0.5 &&
    Math.abs(invert.y) < 0.5 &&
    Math.abs(invert.scaleX - 1) < 0.002 &&
    Math.abs(invert.scaleY - 1) < 0.002;
  return still ? null : invert;
}

/** `inversion` as a CSS transform. */
export const toTransform = ({ x, y, scaleX, scaleY }: Inversion) =>
  `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})`;

/**
 * The transform that keeps a child its own size while its parent morphs
 * (the wishlist heart on a photo): the parent's scale undone.
 */
export const counterTransform = ({ scaleX, scaleY }: Inversion) =>
  `scale(${1 / scaleX}, ${1 / scaleY})`;
