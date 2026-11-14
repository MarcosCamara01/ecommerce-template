"use client";

import { useCallback, useMemo, useState } from "react";

/** Open state for a dialog that code opens, not a Radix trigger. */
export interface Disclosure {
  active: boolean;
  open: () => void;
  close: () => void;
  set: (active: boolean) => void;
}

export function useDisclosure(): Disclosure {
  const [active, setActive] = useState(false);

  const open = useCallback(() => setActive(true), []);
  const close = useCallback(() => setActive(false), []);

  return useMemo(
    () => ({ active, open, close, set: setActive }),
    [active, open, close],
  );
}
