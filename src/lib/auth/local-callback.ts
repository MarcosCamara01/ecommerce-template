const DEFAULT_ORIGIN = "http://local.invalid";

export function safeLocalCallback(
  value: unknown,
  canonicalOrigin = DEFAULT_ORIGIN,
) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.includes("\\")
  ) {
    return "/";
  }
  try {
    const origin = new URL(canonicalOrigin).origin;
    const target = new URL(value, origin);
    if (target.origin !== origin) return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}
