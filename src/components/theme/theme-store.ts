"use client";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const currentTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const REVEAL_MS = 500;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/**
 * Switches theme. With an origin point and motion allowed, the new theme is
 * revealed as a circle growing from that point (View Transitions API);
 * otherwise it swaps instantly.
 */
export function setTheme(next: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const apply = () => {
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode: the choice lasts for this page view only.
    }
  };

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!origin || reduceMotion || !document.startViewTransition) {
    apply();
    return;
  }

  // Tinted pages transition --fg/--bg; freeze that while the snapshot runs.
  root.dataset.themeSwitching = "";
  const transition = document.startViewTransition(apply);
  transition.ready
    .then(() => {
      const radius = Math.hypot(
        Math.max(origin.x, innerWidth - origin.x),
        Math.max(origin.y, innerHeight - origin.y),
      );
      root.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: REVEAL_MS,
          easing: EASE_OUT,
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  transition.finished.finally(() => {
    delete root.dataset.themeSwitching;
  });
}

export function toggleTheme(origin?: { x: number; y: number }) {
  setTheme(currentTheme() === "dark" ? "light" : "dark", origin);
}
