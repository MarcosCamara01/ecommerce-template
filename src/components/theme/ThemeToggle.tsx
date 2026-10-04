"use client";

import { cn } from "@/lib/utils";

import { toggleTheme } from "./theme-store";

export const ThemeIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
  </svg>
);

/** Icon button that switches between the light and dark themes. */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Switch colour theme"
      onClick={() => toggleTheme()}
      className={cn(
        "press grid size-11 place-items-center rounded-pill text-fg",
        className,
      )}
    >
      <ThemeIcon />
    </button>
  );
}
