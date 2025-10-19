"use client";

import { useCallback, useMemo, useState } from "react";

export interface Manager {
  active: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  set: (active: boolean) => void;
}

export function useManager(initial: boolean = false): Manager {
  const [active, setActive] = useState(initial);

  const toggle = useCallback(() => setActive((v) => !v), []);
  const open = useCallback(() => setActive(true), []);
  const close = useCallback(() => setActive(false), []);
  const set = useCallback((active: boolean) => setActive(active), []);

  return useMemo(() => {
    return {
      active,
      toggle,
      open,
      close,
      set,
    };
  }, [active, toggle, open, close, set]);
}
