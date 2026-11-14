"use client";

import { useEffect } from "react";

/**
 * data-input="keyboard" on <html> while the visitor moves with the keyboard;
 * any pointer clears it. Set on keydown, before focus moves, so the element
 * losing focus already sees it and can leave at once.
 */
export function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key.startsWith("Arrow")) root.dataset.input = "keyboard";
    };
    const pointer = () => {
      if (root.dataset.input) delete root.dataset.input;
    };
    window.addEventListener("keydown", key, true);
    window.addEventListener("pointerdown", pointer, true);
    window.addEventListener("pointermove", pointer, { capture: true, passive: true });
    return () => {
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("pointerdown", pointer, true);
      window.removeEventListener("pointermove", pointer, true);
    };
  }, []);
  return null;
}
