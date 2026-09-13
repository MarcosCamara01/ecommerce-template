import { pathToFileURL } from "node:url";

const REQUIRED_EVIDENCE = [
  "RELEASE_CUTOVER_EVIDENCE",
  "RELEASE_HOSTED_EXPOSURE_EVIDENCE",
  "RELEASE_CREDENTIAL_ROTATION_EVIDENCE",
];

export function releaseReadinessFailures(environment = process.env) {
  const required =
    environment.VERCEL_ENV === "production" ||
    environment.REQUIRE_RELEASE_EVIDENCE === "true";
  if (!required) return [];
  return REQUIRED_EVIDENCE.filter(
    (key) => !environment[key]?.trim(),
  );
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const missing = releaseReadinessFailures();
  if (missing.length) {
    console.error(
      `Production release blocked: missing ${missing.join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log("Release evidence gate: PASS");
  }
}
