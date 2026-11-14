"use client";

import { useSyncExternalStore } from "react";

/**
 * UI state for the bag drawer, shared by the nav pill, the product page and
 * the drawer itself (they live in different trees: layout and page).
 */
type AddedLine = { name: string; color: string; size: string };

type BagUi = {
  open: boolean;
  /** The line just added, shown as a chip at the top of the drawer. */
  added: AddedLine | null;
  /** Increments to replay the counter bump. */
  bump: number;
  /** A photo is flying to the Bag pill: the pill keeps its count until it lands. */
  held: boolean;
};

let state: BagUi = { open: false, added: null, bump: 0, held: false };
const listeners = new Set<() => void>();

function set(next: Partial<BagUi>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const serverState: BagUi = { open: false, added: null, bump: 0, held: false };

export function useBagUi() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

export const openBag = (added: AddedLine | null = null) => set({ open: true, added });
export const setBagOpen = (open: boolean) => set(open ? { open } : { open, added: null });

let holdTimer: ReturnType<typeof setTimeout> | undefined;

/** A photo is about to fly to the Bag pill: it keeps its count until the photo lands (2.5s at most). */
export const holdBagCount = () => {
  clearTimeout(holdTimer);
  holdTimer = setTimeout(releaseBagCount, 2500);
  set({ held: true });
};

export const releaseBagCount = () => {
  clearTimeout(holdTimer);
  if (state.held) set({ held: false });
};

/** The photo landed: the count rolls and the pill bumps in the same moment. */
export const bumpBag = () => {
  clearTimeout(holdTimer);
  set({ bump: state.bump + 1, held: false });
};
