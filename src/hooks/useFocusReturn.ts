"use client";

import { useRef } from "react";

/**
 * Focus return for dialogs opened from state instead of a Radix trigger.
 * With no trigger, Radix has nothing to hand focus back to and it lands on
 * <body>, so keyboard users lose their place. Spread the result on the
 * dialog's content.
 */
export function useFocusReturn() {
  const openerRef = useRef<HTMLElement | null>(null);

  return {
    // Fires before focus moves into the dialog: whatever holds it opened it.
    onOpenAutoFocus: () => {
      const active = document.activeElement;
      openerRef.current =
        active instanceof HTMLElement && active !== document.body ? active : null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      const opener = openerRef.current;
      openerRef.current = null;
      // A control that left the page while the dialog was open stays gone.
      if (opener?.isConnected && opener.getClientRects().length > 0) {
        opener.focus();
      }
    },
  };
}
