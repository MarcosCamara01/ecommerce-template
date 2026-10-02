"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Inverted pill toasts from CStates. They enter and leave through the
 * bottom (350ms in, 250ms out, ease-out; see globals.css) and pause on
 * hover. Errors use the error surface.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      duration={4000}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-toast bg-fg py-2 pl-[18px] pr-2 text-bg shadow-lift min-h-14",
          title: "grow font-medium",
          description: "text-13 opacity-85",
          icon: "shrink-0",
          actionButton:
            "press h-10 shrink-0 rounded-pill border border-current bg-transparent px-4 text-sm font-semibold",
          cancelButton:
            "press h-10 shrink-0 rounded-pill bg-transparent px-3 text-sm font-medium",
          error: "!bg-err-bg !text-err-fg",
        },
      }}
    />
  );
}
