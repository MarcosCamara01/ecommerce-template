"use client";

import { cn } from "@/lib/utils";

import { toggleTheme, useTheme } from "./theme-store";

const ThemeIcon = ({ className }: { className?: string }) => (
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

/**
 * Icon button that switches between the light and dark themes. It lives in
 * the navigation and is the only theme control in the store, so it is also
 * what keeps the page following the OS theme until the visitor picks one.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  return (
    <button
      type="button"
      aria-label={
        theme === "dark"
          ? "Switch to light theme"
          : theme === "light"
            ? "Switch to dark theme"
            : "Switch colour theme"
      }
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
