export function appOwnerStudioUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const existingOptions = url.searchParams.get("options")?.trim();
  if (existingOptions && /(?:^|\s)role\s*=/.test(existingOptions)) {
    throw new Error("MIGRATION_DATABASE_URL must not pre-assume a database role");
  }
  url.searchParams.set(
    "options",
    [existingOptions, "-c role=app_owner"].filter(Boolean).join(" "),
  );
  return url.toString();
}
