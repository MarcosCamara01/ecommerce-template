/**
 * Advance widths (in em) of Archivo at width 62%, weight 900, uppercase,
 * measured in the browser. Used to size a display word so it fills its
 * line without overflowing (the Viewport Scale Rule in DESIGN.md).
 */
const ADVANCE: Record<string, number> = {
  A: 0.52, B: 0.49, C: 0.5, D: 0.5, E: 0.45, F: 0.39, G: 0.53, H: 0.5,
  I: 0.25, J: 0.44, K: 0.5, L: 0.42, M: 0.7, N: 0.51, O: 0.54, P: 0.48,
  Q: 0.54, R: 0.5, S: 0.46, T: 0.47, U: 0.49, V: 0.48, W: 0.72, X: 0.49,
  Y: 0.47, Z: 0.47, "0": 0.43, "1": 0.36, "2": 0.42, "3": 0.43, "4": 0.43,
  "5": 0.43, "6": 0.44, "7": 0.39, "8": 0.42, "9": 0.44, "-": 0.23,
  "%": 0.73, " ": 0.1, ".": 0.21, "&": 0.56, "'": 0.2,
};

const advance = (text: string) =>
  text.toUpperCase().split("").reduce(
    (total, char) => total + (ADVANCE[char] ?? 0.5),
    0,
  );

/** Width of `text` in em, with a 3% margin for kerning and rounding. */
export function displayEm(text: string): number {
  return Math.max(advance(text), 1) * 1.03;
}

/**
 * How many lines `text` takes in display type in a measure of `measureEm`
 * (the width of its column over the font size). Lines break at spaces and
 * after hyphens, as the browser breaks them.
 */
export function displayLines(text: string, measureEm: number): number {
  let lines = 1;
  let used = 0;
  for (const word of text.trim().split(/\s+/)) {
    // "QUARTER-ZIP" may break after its hyphen.
    word.split(/(?<=-)/).forEach((chunk, index) => {
      const width = advance(chunk) * 1.03;
      const gap = index === 0 && used > 0 ? ADVANCE[" "] : 0;
      if (used > 0 && used + gap + width > measureEm) {
        lines += 1;
        used = width;
      } else {
        used += gap + width;
      }
    });
  }
  return lines;
}

/**
 * The largest of `steps` (largest first) at which `text` is no taller than
 * `budgetPx`, in a column `measureEm` wide at the first step. The smallest
 * step if none fits.
 */
export function fitDisplayStep<Step extends { px: number; leading: number }>(
  text: string,
  steps: readonly Step[],
  { measureEm, budgetPx }: { measureEm: number; budgetPx: number },
): Step {
  const [largest] = steps;
  return (
    steps.find((step) => {
      const lines = displayLines(text, (measureEm * largest.px) / step.px);
      return lines * step.px * step.leading <= budgetPx;
    }) ?? steps[steps.length - 1]
  );
}

/**
 * `min(<px>, <vw>)` that fits `text` on one line: at most `maxPx`, never
 * wider than `budgetPx`, and scaling as `vwBudget` vw below that.
 */
export function fitDisplaySize(
  text: string,
  { maxPx, budgetPx, vwBudget }: { maxPx: number; budgetPx: number; vwBudget: number },
): string {
  const em = displayEm(text);
  const px = Math.min(maxPx, Math.floor(budgetPx / em));
  return `min(${px}px, ${(vwBudget / em).toFixed(2)}vw)`;
}
