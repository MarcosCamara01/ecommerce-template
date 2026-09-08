import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_IMAGE_ACCEPT,
  CATALOG_IMAGE_ALLOWED_MIME_TYPES,
  CATALOG_IMAGE_BATCH_MAX_BYTES,
  CATALOG_IMAGE_HELP_TEXT,
  CATALOG_IMAGE_MAX_BYTES,
  PRODUCT_IMAGES_BUCKET_MAX_BYTES,
  catalogImageBatchErrors,
  catalogImageExtension,
  catalogImageFileErrors,
} from "./image-file-contract.ts";

const headers = {
  "image/jpeg": Uint8Array.from([0xff, 0xd8, 0xff]),
  "image/png": Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]),
  "image/webp": Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]),
};

function imageFile(type, size = headers[type].length) {
  const header = headers[type];
  return new File(
    [header, new Uint8Array(Math.max(0, size - header.length))],
    "image",
    { type },
  );
}

test("catalog image contract leaves multipart headroom below Vercel's limit", async () => {
  assert.deepEqual(CATALOG_IMAGE_ALLOWED_MIME_TYPES, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  assert.equal(CATALOG_IMAGE_ACCEPT, "image/jpeg,image/png,image/webp");
  assert.equal(CATALOG_IMAGE_MAX_BYTES, 3 * 1024 * 1024);
  assert.equal(CATALOG_IMAGE_BATCH_MAX_BYTES, CATALOG_IMAGE_MAX_BYTES);
  assert.equal(PRODUCT_IMAGES_BUCKET_MAX_BYTES, 5 * 1024 * 1024);
  assert.match(CATALOG_IMAGE_HELP_TEXT, /3 MiB/);
  assert.equal(
    catalogImageExtension(
      new File([headers["image/webp"]], "attacker-controlled.html", {
        type: "image/webp",
      }),
    ),
    "webp",
  );
  assert.throws(
    () => catalogImageExtension({ type: "text/html" }),
    /Unsupported catalog image MIME type/,
  );

  for (const type of CATALOG_IMAGE_ALLOWED_MIME_TYPES) {
    assert.deepEqual(
      await catalogImageFileErrors(imageFile(type, CATALOG_IMAGE_MAX_BYTES)),
      [],
    );
  }
  assert.deepEqual(
    catalogImageBatchErrors([
      { size: CATALOG_IMAGE_BATCH_MAX_BYTES - 1 },
      { size: 1 },
    ]),
    [],
  );
  assert.deepEqual(
    catalogImageBatchErrors([
      { size: CATALOG_IMAGE_BATCH_MAX_BYTES },
      { size: 1 },
    ]),
    ["New images must total 3 MiB or less per submission"],
  );
});

test("catalog image contract returns clear MIME, content, and size errors", async () => {
  assert.deepEqual(
    await catalogImageFileErrors(
      new File(["gif"], "image.gif", { type: "image/gif" }),
    ),
    ["Image must be JPEG, PNG, or WebP"],
  );
  assert.deepEqual(
    await catalogImageFileErrors(
      imageFile("image/webp", CATALOG_IMAGE_MAX_BYTES + 1),
    ),
    ["Image must be 3 MiB or smaller"],
  );
  assert.deepEqual(
    await catalogImageFileErrors(
      new File(
        [new Uint8Array(CATALOG_IMAGE_MAX_BYTES + 1)],
        "payload.txt",
        { type: "text/plain" },
      ),
    ),
    ["Image must be JPEG, PNG, or WebP", "Image must be 3 MiB or smaller"],
  );
  assert.deepEqual(
    await catalogImageFileErrors(
      new File(["not-a-webp"], "spoofed.webp", { type: "image/webp" }),
    ),
    ["Image contents must match its declared JPEG, PNG, or WebP type"],
  );
  assert.deepEqual(
    await catalogImageFileErrors(
      new File([headers["image/png"]], "mismatch.jpg", {
        type: "image/jpeg",
      }),
    ),
    ["Image contents must match its declared JPEG, PNG, or WebP type"],
  );
});
