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
};

let state: BagUi = { open: false, added: null, bump: 0 };
const listeners = new Set<() => void>();

function set(next: Partial<BagUi>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const serverState: BagUi = { open: false, added: null, bump: 0 };

export function useBagUi() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

export const openBag = (added: AddedLine | null = null) => set({ open: true, added });
export const setBagOpen = (open: boolean) => set(open ? { open } : { open, added: null });
export const bumpBag = () => set({ bump: state.bump + 1 });
