"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshStatusProps {
  active: boolean;
  intervalMs?: number;
}

export function AutoRefreshStatus({
  active,
  intervalMs = 5000,
}: AutoRefreshStatusProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [active, intervalMs, router]);

  return null;
}
