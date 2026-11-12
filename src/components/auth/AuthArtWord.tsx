"use client";

import { useSelectedLayoutSegment } from "next/navigation";

export function AuthArtWord() {
  const segment = useSelectedLayoutSegment();
  return <>{segment === "register" ? "Join" : "Hello again"}</>;
}
