import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_IMAGE_ALLOWED_MIME_TYPES,
  CATALOG_IMAGE_BATCH_MAX_BYTES,
  CATALOG_IMAGE_MAX_BYTES,
  CATALOG_PRODUCT_DESCRIPTION_MAX_LENGTH,
  CATALOG_PRODUCT_NAME_MAX_LENGTH,
  CATALOG_VARIANT_COLOR_MAX_LENGTH,
  CATALOG_VARIANT_IMAGE_MAX_COUNT,
  catalogVariantImageCountSchema,
  catalogProductDescriptionSchema,
  catalogProductNameSchema,
  catalogVariantColorSchema,
  validateCatalogImageFile,
  validateCatalogImageBatch,
  readVariantImageFiles,
  mergeVariantImageUrls,
} from "./input-validation.ts";

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

test("catalog text validation matches PostgreSQL varchar limits", () => {
  assert.equal(
    catalogProductNameSchema.parse("n".repeat(CATALOG_PRODUCT_NAME_MAX_LENGTH)).length,
    CATALOG_PRODUCT_NAME_MAX_LENGTH,
  );
  assert.equal(
    catalogVariantColorSchema.parse("c".repeat(CATALOG_VARIANT_COLOR_MAX_LENGTH)).length,
    CATALOG_VARIANT_COLOR_MAX_LENGTH,
  );
  assert.throws(() =>
    catalogProductNameSchema.parse("n".repeat(CATALOG_PRODUCT_NAME_MAX_LENGTH + 1))
  );
  assert.throws(() =>
    catalogVariantColorSchema.parse("c".repeat(CATALOG_VARIANT_COLOR_MAX_LENGTH + 1))
  );
  const validDescription = "d".repeat(
    CATALOG_PRODUCT_DESCRIPTION_MAX_LENGTH,
  );
  assert.equal(
    catalogProductDescriptionSchema.parse(validDescription).length,
    CATALOG_PRODUCT_DESCRIPTION_MAX_LENGTH,
  );
  assert.throws(() =>
    catalogProductDescriptionSchema.parse(validDescription + "d"),
  );
});

test("final variant images are deduplicated and capped", () => {
  assert.deepEqual(
    mergeVariantImageUrls(["one", "two"], ["two", "three"], 0),
    ["one", "two", "three"],
  );
  assert.throws(() => mergeVariantImageUrls(
    Array.from({ length: CATALOG_VARIANT_IMAGE_MAX_COUNT }, (_, index) => `old-${index}`),
    ["new"],
    0,
  ));
});

test("variant upload counts are bounded and match concrete files", () => {
  assert.throws(() =>
    catalogVariantImageCountSchema.parse(CATALOG_VARIANT_IMAGE_MAX_COUNT + 1)
  );
  const form = new FormData();
  form.set(
    "variant_0_image_0",
    new File(["one"], "one.jpg", { type: "image/jpeg" }),
  );
  assert.equal(readVariantImageFiles(form, 0, 1).length, 1);
  assert.throws(() => readVariantImageFiles(form, 0, 0));
  assert.throws(() => readVariantImageFiles(form, 0, 2));
});

test("catalog images accept valid signatures within the function upload limit", async () => {
  assert.deepEqual(CATALOG_IMAGE_ALLOWED_MIME_TYPES, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  for (const type of CATALOG_IMAGE_ALLOWED_MIME_TYPES) {
    await assert.doesNotReject(() =>
      validateCatalogImageFile(
        imageFile(type),
        ["img"],
      ),
    );
  }
  await assert.doesNotReject(() =>
    validateCatalogImageFile(
      imageFile("image/webp", CATALOG_IMAGE_MAX_BYTES),
      ["img"],
    ),
  );
});

test("catalog image validation reports MIME, content, size, and batch fields", async () => {
  await assert.rejects(
    () =>
      validateCatalogImageFile(
        new File(["not-an-image"], "payload.txt", { type: "text/plain" }),
        ["img"],
      ),
    (error) => {
      assert.deepEqual(error.issues, [
        {
          code: "custom",
          path: ["img"],
          message: "Image must be JPEG, PNG, or WebP",
        },
      ]);
      return true;
    },
  );

  await assert.rejects(
    () =>
      validateCatalogImageFile(
        imageFile("image/webp", CATALOG_IMAGE_MAX_BYTES + 1),
        ["variants", 0, "images"],
      ),
    (error) => {
      assert.deepEqual(error.issues, [
        {
          code: "custom",
          path: ["variants", 0, "images"],
          message: "Image must be 3 MiB or smaller",
        },
      ]);
      return true;
    },
  );

  await assert.rejects(
    () =>
      validateCatalogImageFile(
        new File(["spoofed"], "spoofed.webp", { type: "image/webp" }),
        ["img"],
      ),
    /Image contents must match its declared JPEG, PNG, or WebP type/,
  );

  assert.throws(
    () =>
      validateCatalogImageBatch([
        imageFile("image/png", CATALOG_IMAGE_BATCH_MAX_BYTES),
        imageFile("image/jpeg"),
      ]),
    (error) => {
      assert.deepEqual(error.issues, [
        {
          code: "custom",
          path: ["images"],
          message: "New images must total 3 MiB or less per submission",
        },
      ]);
      return true;
    },
  );
});
