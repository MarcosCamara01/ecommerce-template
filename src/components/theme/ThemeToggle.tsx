"use client";

import { cn } from "@/lib/utils";

import { toggleTheme } from "./theme-store";

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

/** Icon button that reveals the other theme as a circle from itself. */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Switch colour theme"
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        toggleTheme({
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
        });
      }}
      className={cn(
        "press grid size-11 place-items-center rounded-pill text-fg",
        className,
      )}
    >
      <ThemeIcon />
    </button>
  );
}
