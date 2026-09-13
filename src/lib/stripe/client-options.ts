const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

export function createStripeClientOptions(
  emulatorUrl?: string,
  nodeEnv = process.env.NODE_ENV,
) {
  if (!emulatorUrl) {
    return {
      apiVersion: STRIPE_API_VERSION,
      telemetry: true,
    };
  }

  const url = new URL(emulatorUrl);
  const loopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]" ||
    url.hostname.endsWith(".localhost");
  if (
    nodeEnv === "production" ||
    !loopback ||
    url.username ||
    url.password ||
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "STRIPE_EMULATOR_URL is development-only and must use a loopback HTTP origin without credentials or a path",
    );
  }

  return {
    apiVersion: STRIPE_API_VERSION,
    telemetry: false,
    host: url.hostname,
    port: url.port
      ? Number(url.port)
      : url.protocol === "https:"
        ? 443
        : 80,
    protocol: url.protocol.slice(0, -1) as "http" | "https",
  };
}
