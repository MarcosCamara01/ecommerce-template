"use client";

import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const hasStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark";
  } catch {
    return false;
  }
};

const currentTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

// While this class is on <html> nothing transitions (see globals.css).
const SWITCHING = "theme-switching";

/** Android tints its toolbar from theme-color, and a stored theme can differ from the system's. */
function syncThemeColor(theme: Theme) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", theme === "dark" ? "#141516" : "#e4e7ea"));
}

/**
 * Puts a theme on the page at once. Every colour changes together, so
 * transitions are switched off for the swap: left on, they would all fade
 * at the same time and the change would smear instead of snapping.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle(SWITCHING, true);
  root.classList.toggle("dark", theme === "dark");
  // Reading layout commits the new colours while transitions are still off;
  // they come back once that frame has painted.
  document.body.getBoundingClientRect();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.toggle(SWITCHING, false)),
  );
  syncThemeColor(theme);
}

function subscribe(listener: () => void) {
  syncThemeColor(currentTheme());
  listeners.add(listener);
  const media = matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (hasStoredTheme()) return;
    applyTheme(media.matches ? "dark" : "light");
    emit();
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

/** Current theme, or null during server render and hydration. */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, currentTheme, () => null);
}

/** Switches theme at once, with no animation, and remembers the choice. */
export function setTheme(next: Theme) {
  applyTheme(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode: the choice lasts for this page view only.
  }
  emit();
}

export function toggleTheme() {
  setTheme(currentTheme() === "dark" ? "light" : "dark");
}
