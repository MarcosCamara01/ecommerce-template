import { parsePositiveIntegerId } from "./positive-integer-id.ts";

/**
 * Paths that `[category]` / `[category]/[id]` would otherwise swallow.
 * Keep in sync with ProductCategoryZod in schema/products.ts.
 */
const PRODUCT_CATEGORY_SLUGS = new Set(["t-shirts", "pants", "sweatshirts"]);

const ROOT_ONLY_SEGMENTS = new Set([
  "login",
  "register",
  "search",
  "cart",
  "wishlist",
  "result",
]);

/**
 * Unmatched 3-segment path so Next.js serves not-found.tsx with HTTP 404.
 * `[category]` is 1 segment and `[category]/[id]` is 2, so this never hits them.
 */
export const NOT_FOUND_INTERNAL_PATH = "/internal/not-found/fallback";

export function pathShould404(pathname: string): boolean {
  if (pathname === NOT_FOUND_INTERNAL_PATH) {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return false;
  }

  const [first, ...rest] = segments;

  if (PRODUCT_CATEGORY_SLUGS.has(first)) {
    if (rest.length === 0) return false;
    // Invalid ids must be rejected before the dynamic route streams a 200.
    return rest.length > 1 || parsePositiveIntegerId(rest[0]) === null;
  }

  if (ROOT_ONLY_SEGMENTS.has(first)) {
    return rest.length > 0;
  }

  if (first === "orders") {
    if (rest.length === 0) return false;
    return rest.length > 1 || parsePositiveIntegerId(rest[0]) === null;
  }

  if (first === "api" || first === "admin") {
    // Their real descendants have at least three URL segments. A two-segment
    // miss would otherwise fall through to `[category]/[id]`.
    return rest.length === 1;
  }

  if (first === "help") {
    return false;
  }

  return true;
}
