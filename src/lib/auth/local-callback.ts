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
    const callback = `${target.pathname}${target.search}${target.hash}`;
    // Dot segments can normalize "/.//host" to "//host", which leaves the origin.
    return callback.startsWith("//") ? "/" : callback;
  } catch {
    return "/";
  }
}

export function signInPath(returnTo: string) {
  return `/login?redirect=${encodeURIComponent(returnTo)}`;
}
