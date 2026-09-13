import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CATALOG_IMAGE_ALLOWED_MIME_TYPES,
  PRODUCT_IMAGES_BUCKET_MAX_BYTES,
} from "./image-file-contract.ts";

test("local Supabase declares the public product image bucket contract", async () => {
  const config = await readFile("supabase/config.toml", "utf8");
  const header = "[storage.buckets.product-images]";
  const start = config.indexOf(header);
  assert.notEqual(start, -1);
  const nextSection = config.indexOf("\n[", start + header.length);
  const bucket = config.slice(
    start,
    nextSection === -1 ? config.length : nextSection,
  );

  assert.match(bucket, /public\s*=\s*true/);
  const sizeLimit = bucket.match(/file_size_limit\s*=\s*"([^"]+)"/);
  assert.equal(
    sizeLimit?.[1],
    `${PRODUCT_IMAGES_BUCKET_MAX_BYTES / 1024 / 1024}MiB`,
  );
  const mimeTypes = bucket.match(/allowed_mime_types\s*=\s*(\[[^\n]*\])/);
  assert.deepEqual(
    JSON.parse(mimeTypes?.[1] ?? "null"),
    CATALOG_IMAGE_ALLOWED_MIME_TYPES,
  );
});
