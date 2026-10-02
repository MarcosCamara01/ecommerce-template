import { colorMapping } from "../constants/colors.ts";

/**
 * Page tint for a garment colour (the Tint Contract in DESIGN.md): a ground
 * and an ink for each theme. Known colours use the values tuned on the
 * design canvas; anything else is derived from its `colorMapping` swatch in
 * OKLCH and checked for WCAG AA.
 */
export type TintPair = { bg: string; fg: string };
export type Tint = { light: TintPair; dark: TintPair; glassLight: string; glassDark: string };

const tuned: Record<string, [string, string, string, string]> = {
  "grey marl": ["#DCDFE2", "#111214", "#2A2D31", "#E9EBED"],
  grey: ["#C9CBCD", "#121314", "#26282B", "#E8E9EA"],
  black: ["#CFCBC4", "#141310", "#121212", "#F1F1F1"],
  "navy blue": ["#2E3A4F", "#EEF2F7", "#121924", "#DDE4EE"],
  navy: ["#3B4A66", "#EEF1F7", "#161D2B", "#DDE3EE"],
  "sky blue": ["#AFC3D6", "#0D1A27", "#1B2A3A", "#DCE7F2"],
  blue: ["#9FB0C4", "#0F1823", "#18222E", "#DCE4EE"],
};

const normalize = (name: string) =>
  name.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");

type Oklch = { l: number; c: number; h: number };

const toLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const fromLinear = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) };
}

function oklchToHex({ l: L, c, h }: Oklch): string {
  const A = c * Math.cos(h);
  const B = c * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return rgbToHex([
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]);
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Frosted glass for the nav pill: brighter over dark ink, softer over light. */
const glassFor = (fg: string) =>
  luminance(fg) > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.45)";

function derive(swatch: string): [string, string, string, string] {
  const { l, c, h } = hexToOklch(swatch);
  const colourful = c > 0.03;
  // A deep colour (navy, forest) floods the page as itself; light, pale or
  // near-neutral garments sit on a lifted version of their hue.
  const lightBg =
    l < 0.5 && colourful
      ? oklchToHex({ l: Math.min(Math.max(l, 0.3), 0.42), c: Math.min(c, 0.08), h })
      : oklchToHex({ l: Math.min(Math.max(l + 0.12, 0.8), 0.93), c: Math.min(c * 0.7, 0.06), h });
  const lightFg =
    l < 0.5 && colourful
      ? oklchToHex({ l: 0.96, c: Math.min(c, 0.015), h })
      : oklchToHex({ l: 0.18, c: Math.min(c, 0.03), h });
  const darkBg = oklchToHex({ l: 0.25, c: Math.min(c * 0.6, 0.04), h });
  const darkFg = oklchToHex({ l: 0.93, c: Math.min(c, 0.02), h });
  return [lightBg, lightFg, darkBg, darkFg];
}

function resolveSwatch(name: string): string | null {
  const normalized = normalize(name);
  if (colorMapping[normalized]) return colorMapping[normalized];
  const match = Object.keys(colorMapping)
    .sort((a, b) => b.length - a.length)
    .find((key) => normalized.includes(key));
  return match ? colorMapping[match] : null;
}

const NEUTRAL: [string, string, string, string] = ["#E4E7EA", "#111214", "#141516", "#ECEDEE"];

export function tintForColor(colorName: string): Tint {
  // Multi-colour names ("Navy / White") take their first colour.
  const primary = normalize(colorName.split("/")[0] ?? colorName);
  const swatch = resolveSwatch(primary);
  const values = tuned[primary] ?? (swatch ? derive(swatch) : NEUTRAL);
  const [lightBg, lightFg, darkBg, darkFg] =
    contrastRatio(values[0], values[1]) >= 4.5 &&
    contrastRatio(values[2], values[3]) >= 4.5
      ? values
      : NEUTRAL;
  return {
    light: { bg: lightBg, fg: lightFg },
    dark: { bg: darkBg, fg: darkFg },
    glassLight: glassFor(lightFg),
    glassDark: glassFor(darkFg),
  };
}
