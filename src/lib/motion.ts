/**
 * Motion tokens for JS-driven animation (Motion, WAAPI). They mirror the CSS
 * custom properties in src/styles/globals.css; DESIGN.md lists both.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The only spring in the system: drag release on mobile panels. */
export const DRAG_SPRING = { type: "spring", duration: 0.5, bounce: 0.2 } as const;
