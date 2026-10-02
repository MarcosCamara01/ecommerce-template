"use client";

import { useSyncExternalStore } from "react";

/**
 * Open state for the search modal. `instant` opens skip the entrance:
 * keyboard shortcuts are used too often to animate.
 */
type SearchUi = { open: boolean; instant: boolean };

let state: SearchUi = { open: false, instant: false };
const listeners = new Set<() => void>();
const set = (next: SearchUi) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const serverState: SearchUi = { open: false, instant: false };

export function useSearchUi() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => serverState,
  );
}

export const openSearch = (instant = false) => set({ open: true, instant });
export const setSearchOpen = (open: boolean) => set({ open, instant: state.instant });

// Versioned: bump if the stored shape ever changes.
const RECENT_KEY = "store:recent-searches:v1";
const recentListeners = new Set<() => void>();
let recentCache: string[] | null = null;

const readRecent = (): string[] => {
  if (recentCache) return recentCache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    recentCache = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    recentCache = [];
  }
  return recentCache;
};

const EMPTY: string[] = [];

/** This browser's last five searches. */
export function useRecentSearches() {
  return useSyncExternalStore(
    (listener) => {
      recentListeners.add(listener);
      return () => recentListeners.delete(listener);
    },
    readRecent,
    () => EMPTY,
  );
}

export function rememberSearch(query: string) {
  const term = query.trim();
  if (!term) return;
  recentCache = [term, ...readRecent().filter((item) => item !== term)].slice(0, 5);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentCache));
  } catch {
    // Storage unavailable: recent searches last for this page view.
  }
  recentListeners.forEach((listener) => listener());
}
