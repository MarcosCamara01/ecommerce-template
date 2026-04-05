import type { CSSProperties } from "react";

interface ColorMapping {
  [key: string]: string;
}

export const colorMapping: ColorMapping = {
  anthracite: "#4A4A4A",
  "anthracite grey": "#4B525A",
  beige: "#E8E0D5",
  black: "#1A1A1A",
  blue: "#6B8CAE",
  bluish: "#7088A0",
  charcoal: "#3F434A",
  coral: "#E67F6A",
  "coral red": "#D96B59",
  cream: "#EFE8D8",
  ecru: "#F0EBE3",
  green: "#5D7B6F",
  grey: "#9CA3AF",
  "grey marl": "#B8BDC6",
  "light green": "#A8C5B5",
  "mid blue": "#5F7FA5",
  navy: "#2F4360",
  "navy blue": "#2C3E50",
  "oyster white": "#F3EEE4",
  red: "#B85C4E",
  "sky blue": "#7C97B6",
  straw: "#D8C39B",
  white: "#FAFAFA",
};

const normalizeColorName = (colorName: string) =>
  colorName.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");

const resolveSolidColor = (colorName: string) => {
  const normalized = normalizeColorName(colorName);

  if (colorMapping[normalized]) {
    return colorMapping[normalized];
  }

  const fallbackEntries = Object.entries(colorMapping).sort(
    ([left], [right]) => right.length - left.length,
  );

  const matchedEntry = fallbackEntries.find(([key]) => normalized.includes(key));

  return matchedEntry?.[1] ?? "#6B7280";
};

export const getColorSwatchStyle = (colorName: string): CSSProperties => {
  const parts = colorName
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const resolvedColors = parts.map(resolveSolidColor);
    const stops = resolvedColors
      .map((color, index) => {
        const start = Math.round((index / resolvedColors.length) * 100);
        const end = Math.round(((index + 1) / resolvedColors.length) * 100);

        return `${color} ${start}% ${end}%`;
      })
      .join(", ");

    return {
      background: `linear-gradient(90deg, ${stops})`,
    };
  }

  return {
    backgroundColor: resolveSolidColor(colorName),
  };
};
