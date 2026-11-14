/**
 * The one word that names a piece on the home hero ("Basic quarter-zip
 * sweatshirt" → "Quarter-zip"): the longest word that is not a garment
 * type, fit or filler. Ties keep the earlier word.
 */
const GENERIC = new Set([
  "basic", "fit", "relaxed", "regular", "slim", "oversize", "oversized",
  "with", "and", "the", "of", "in", "for", "text", "prints", "print",
  "t-shirt", "tshirt", "shirt", "sweatshirt", "sweatshirts", "trousers",
  "pants", "jumper", "sweater", "100%",
]);

export function heroWord(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const candidates = words.filter((word) => !GENERIC.has(word.toLowerCase()));
  const pick = (candidates.length > 0 ? candidates : words).reduce(
    (best, word) => (word.length > best.length ? word : best),
    "",
  );
  return pick.charAt(0).toUpperCase() + pick.slice(1).toLowerCase();
}

// Firefox before 125 has no Intl.Segmenter, and the checkout success page
// imports this module too: there letters fall back to code points.
const graphemes =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;
// Scripts that join or shape their letters must stay one run to be drawn right.
const RISES_PER_LETTER = /^[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{M}\p{N}\p{P}\s]+$/u;

/**
 * The hero word in capitals, cut into the pieces that rise one after
 * another: its letters (graphemes, so accents stay on their letter) in
 * Latin, Greek and Cyrillic, or the whole word in a script that joins or
 * shapes its letters (Arabic, Devanagari, Thai) or has no capitals (CJK).
 */
export function heroLetters(word: string): string[] {
  const upper = word.toUpperCase();
  return RISES_PER_LETTER.test(upper)
    ? graphemes
      ? Array.from(graphemes.segment(upper), (part) => part.segment)
      : Array.from(upper)
    : [upper];
}
