import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 10_000;
const PRODUCT_IMAGES_BUCKET = "product-images";
const PRODUCT_IMAGES_MAX_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGES_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

class SafeVerificationError extends Error {}

function requiredEnvironment(environment) {
  const accessToken = environment.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = environment.SUPABASE_PROJECT_REF?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const missing = [];
  if (!accessToken) missing.push("SUPABASE_ACCESS_TOKEN");
  if (!projectRef) missing.push("SUPABASE_PROJECT_REF");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    throw new Error(
      `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`,
    );
  }
  if (!/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error(
      "SUPABASE_PROJECT_REF must be a 20-character lowercase project reference",
    );
  }
  return { accessToken, projectRef, serviceRoleKey };
}

async function fetchJson({ fetchImpl, headers, label, timeoutMs, url }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref?.();
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new SafeVerificationError(`${label} returned ${response.status}`);
    }
    try {
      return await response.json();
    } catch {
      throw new SafeVerificationError(`${label} returned invalid JSON`);
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${label} request timed out`);
    }
    if (error instanceof SafeVerificationError) throw error;
    throw new Error(`${label} request failed`);
  } finally {
    clearTimeout(timeout);
  }
}

function expectedSchemasFrom(config) {
  const schemasMatch = config.match(/^schemas\s*=\s*(\[[^\n]*\])/m);
  if (!schemasMatch) {
    throw new Error("supabase/config.toml has no API schemas allowlist");
  }
  return JSON.parse(schemasMatch[1]).map(String).sort();
}

function verifyBucketContract(buckets) {
  if (!Array.isArray(buckets)) {
    throw new Error("Supabase Storage API returned an invalid bucket list");
  }
  const bucket = buckets.find(
    (candidate) =>
      candidate &&
      typeof candidate === "object" &&
      candidate.id === PRODUCT_IMAGES_BUCKET,
  );
  if (!bucket) {
    throw new Error(
      `Hosted Storage drift: required bucket ${PRODUCT_IMAGES_BUCKET} is missing`,
    );
  }
  if (bucket.public !== true) {
    throw new Error(
      `Hosted Storage drift: ${PRODUCT_IMAGES_BUCKET} must be public`,
    );
  }
  if (bucket.file_size_limit !== PRODUCT_IMAGES_MAX_BYTES) {
    throw new Error(
      `Hosted Storage drift: ${PRODUCT_IMAGES_BUCKET} file_size_limit must be ${PRODUCT_IMAGES_MAX_BYTES} bytes`,
    );
  }
  const actualMimeTypes = Array.isArray(bucket.allowed_mime_types)
    ? [...bucket.allowed_mime_types].sort()
    : [];
  if (
    JSON.stringify(actualMimeTypes) !==
    JSON.stringify(PRODUCT_IMAGES_MIME_TYPES)
  ) {
    throw new Error(
      `Hosted Storage drift: ${PRODUCT_IMAGES_BUCKET} allowed_mime_types must be exactly [${PRODUCT_IMAGES_MIME_TYPES.join(",")}]`,
    );
  }
}

export async function verifyHostedExposure({
  environment = process.env,
  fetchImpl = fetch,
  log = console.log,
  projectRoot = process.cwd(),
  readConfiguration = () =>
    readFile(resolve(projectRoot, "supabase/config.toml"), "utf8"),
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const { accessToken, projectRef, serviceRoleKey } =
    requiredEnvironment(environment);
  const expectedSchemas = expectedSchemasFrom(await readConfiguration());
  const settings = await fetchJson({
    fetchImpl,
    headers: { Authorization: `Bearer ${accessToken}` },
    label: "Supabase Management API",
    timeoutMs,
    url: `https://api.supabase.com/v1/projects/${projectRef}/postgrest`,
  });
  if (
    !settings ||
    typeof settings !== "object" ||
    typeof settings.db_schema !== "string"
  ) {
    throw new Error(
      "Supabase Management API returned invalid PostgREST settings",
    );
  }
  const actualSchemas = settings.db_schema
    .split(",")
    .map((schema) => schema.trim())
    .filter(Boolean)
    .sort();

  if (JSON.stringify(actualSchemas) !== JSON.stringify(expectedSchemas)) {
    throw new Error(
      `Hosted Data API drift: expected [${expectedSchemas.join(",")}], received [${actualSchemas.join(",")}]`,
    );
  }
  if (actualSchemas.includes("public") || actualSchemas.includes("app_private")) {
    throw new Error(
      "Application schemas must not be exposed by the hosted Data API",
    );
  }
  log(`Hosted Data API schema allowlist: PASS [${actualSchemas.join(",")}]`);

  const buckets = await fetchJson({
    fetchImpl,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    label: "Supabase Storage API",
    timeoutMs,
    url: `https://${projectRef}.supabase.co/storage/v1/bucket`,
  });
  verifyBucketContract(buckets);
  log(
    `Hosted Storage bucket ${PRODUCT_IMAGES_BUCKET}: PASS (public, ${PRODUCT_IMAGES_MAX_BYTES} bytes, ${PRODUCT_IMAGES_MIME_TYPES.join(",")})`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  void verifyHostedExposure().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Hosted verification failed",
    );
    process.exitCode = 1;
  });
}
