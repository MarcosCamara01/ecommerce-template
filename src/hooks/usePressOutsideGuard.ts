"use client";

import { useLayoutEffect, useRef } from "react";

type PressOutside = CustomEvent<{ originalEvent: PointerEvent }>;

/**
 * For a sheet that stays mounted while it leaves. Radix treats a press
 * outside it as a dismissal and delivers it after the click, so a press
 * that reopens a leaving sheet (the Bag pill under a closing drawer) would
 * close it again at once. Spread on the content: a press that began before
 * the sheet last opened is not a dismissal of it.
 */
export function usePressOutsideGuard(open: boolean) {
  const openedAt = useRef(0);
  useLayoutEffect(() => {
    if (open) openedAt.current = performance.now();
  }, [open]);

  return {
    onPointerDownOutside: (event: PressOutside) => {
      if (event.detail.originalEvent.timeStamp < openedAt.current) event.preventDefault();
    },
  };
}
