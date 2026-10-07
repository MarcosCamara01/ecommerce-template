/**
 * Product names for body text. Catalogue names typed in capitals
 * ("BASIC QUARTER-ZIP SWEATSHIRT") read as sentence case next to the display
 * type; names that already carry their own casing are left alone.
 */
export function displayName(name: string): string {
  if (name !== name.toUpperCase()) return name;
  const lower = name.toLowerCase();
  return (lower.charAt(0).toUpperCase() + lower.slice(1)).replace(
    /\bt-shirt/g,
    "T-shirt",
  );
}
