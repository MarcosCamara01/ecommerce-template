type ApplicationEnvironment = Readonly<Record<string, string | undefined>>;

export function getCanonicalAppOrigin(
  environment: ApplicationEnvironment = process.env,
): string {
  const configured = [
    environment.APP_URL,
    environment.BETTER_AUTH_URL,
    environment.NEXT_PUBLIC_APP_URL,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => parseApplicationOrigin(value.trim()));

  if (configured.length === 0) {
    throw new Error("A canonical application origin is required");
  }
  const [canonicalOrigin] = configured;
  if (configured.some((origin) => origin !== canonicalOrigin)) {
    throw new Error("Configured application origins must match");
  }
  return canonicalOrigin;
}

function parseApplicationOrigin(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("The canonical application origin is invalid");
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("The canonical application origin must be an HTTP origin");
  }

  return url.origin;
}

export function canonicalRequestRedirect(
  requestUrl: URL,
  requestHost: string | null,
  requestProtocol: string | null,
  environment: ApplicationEnvironment = process.env,
): URL | null {
  const canonicalOrigin = getCanonicalAppOrigin(environment);
  const canonicalUrl = new URL(canonicalOrigin);
  const canonicalHost = canonicalUrl.host.toLowerCase();
  const externalProtocol = (requestProtocol || requestUrl.protocol)
    .trim()
    .toLowerCase()
    .replace(/:$/, "");
  const canonicalProtocol = canonicalUrl.protocol.replace(/:$/, "");
  if (
    requestHost?.trim().toLowerCase() === canonicalHost &&
    externalProtocol === canonicalProtocol
  ) return null;

  return new URL(`${requestUrl.pathname}${requestUrl.search}`, canonicalOrigin);
}
