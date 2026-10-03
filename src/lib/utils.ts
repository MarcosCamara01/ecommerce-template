import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know the theme's custom scales, or it reads `text-13`
 * as a colour (and drops it next to `text-muted`) and cannot tell that
 * `rounded-photo` overrides `rounded-pill`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["13"] }],
      rounded: [
        { rounded: ["pill", "field", "chip", "toast", "photo", "photo-lg", "section"] },
      ],
      shadow: [{ shadow: ["float", "lift", "hero"] }],
      "font-family": [{ font: ["display"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
