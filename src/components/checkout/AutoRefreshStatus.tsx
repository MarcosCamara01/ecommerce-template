"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 5000;

export function AutoRefreshStatus({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [active, router]);

  return null;
}
