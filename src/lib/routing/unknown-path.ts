/**
 * Paths that `[category]` / `[category]/[id]` would otherwise swallow.
 * Keep in sync with ProductCategoryZod in schema/products.ts.
 */
const PRODUCT_CATEGORY_SLUGS = new Set(["t-shirts", "pants", "sweatshirts"]);

const KNOWN_ROOT_SEGMENTS = new Set([
  "login",
  "register",
  "search",
  "cart",
  "wishlist",
  "orders",
  "result",
  "admin",
  "api",
]);

/**
 * Unmatched 3-segment path so Next.js serves not-found.tsx with HTTP 404.
 * `[category]` is 1 segment and `[category]/[id]` is 2, so this never hits them.
 */
export const NOT_FOUND_INTERNAL_PATH = "/__/not-found/fallback";

export function pathShould404(pathname: string): boolean {
  if (pathname === NOT_FOUND_INTERNAL_PATH) {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return false;
  }

  const [first, ...rest] = segments;

  if (KNOWN_ROOT_SEGMENTS.has(first)) {
    return false;
  }

  if (PRODUCT_CATEGORY_SLUGS.has(first)) {
    // /t-shirts and /t-shirts/:id are real routes; anything deeper is not.
    return rest.length > 1;
  }

  return true;
}
