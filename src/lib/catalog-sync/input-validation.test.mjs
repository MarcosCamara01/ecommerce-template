import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_PRODUCT_NAME_MAX_LENGTH,
  CATALOG_VARIANT_COLOR_MAX_LENGTH,
  CATALOG_VARIANT_IMAGE_MAX_COUNT,
  catalogVariantImageCountSchema,
  catalogProductNameSchema,
  catalogVariantColorSchema,
  readVariantImageFiles,
  mergeVariantImageUrls,
} from "./input-validation.ts";

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
  form.set("variant_0_image_0", new File(["one"], "one.jpg"));
  assert.equal(readVariantImageFiles(form, 0, 1).length, 1);
  assert.throws(() => readVariantImageFiles(form, 0, 0));
  assert.throws(() => readVariantImageFiles(form, 0, 2));
});
