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
