"use client";

import { cn } from "@/lib/utils";
import { toggleTheme, useTheme } from "@/components/theme/theme-store";

/**
 * Visual dark-mode switch. Pass `interactive={false}` when a parent control
 * (a menu item) owns the click and the ARIA state.
 */
export function ThemeSwitchTrack({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const dark = useTheme() === "dark";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block shrink-0 rounded-pill transition-colors duration-220 ease-in-out",
        size === "md" ? "h-8 w-[52px]" : "h-6 w-10",
        dark ? "bg-fg" : "bg-fg/25",
        className,
      )}
    >
      <span
        className={cn(
          "absolute rounded-pill transition-transform duration-220 ease-in-out motion-reduce:transition-none",
          size === "md" ? "left-1 top-1 size-6" : "left-[3px] top-[3px] size-[18px]",
          dark
            ? cn("bg-bg", size === "md" ? "translate-x-5" : "translate-x-4")
            : "bg-white",
        )}
      />
    </span>
  );
}

export function ThemeSwitch({ className }: { className?: string }) {
  const theme = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark mode"
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        toggleTheme({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }}
      className={cn("press shrink-0 rounded-pill", className)}
    >
      <ThemeSwitchTrack />
    </button>
  );
}
