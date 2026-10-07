"use client";

import { useSelectedLayoutSegment } from "next/navigation";

/** "Hello again" for sign in, "Join" for sign up. */
export function AuthArtWord() {
  const segment = useSelectedLayoutSegment();
  return <>{segment === "register" ? "Join" : "Hello again"}</>;
}
