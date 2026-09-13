import { z } from "zod";

import {
  catalogImageBatchErrors,
  catalogImageFileErrors,
} from "./image-file-contract.ts";

export {
  CATALOG_IMAGE_ALLOWED_MIME_TYPES,
  CATALOG_IMAGE_BATCH_MAX_BYTES,
  CATALOG_IMAGE_MAX_BYTES,
} from "./image-file-contract.ts";

export const CATALOG_PRODUCT_NAME_MAX_LENGTH = 255;
export const CATALOG_PRODUCT_DESCRIPTION_MAX_LENGTH = 10_000;
export const CATALOG_VARIANT_COLOR_MAX_LENGTH = 100;
export const CATALOG_VARIANT_IMAGE_MAX_COUNT = 8;

export async function validateCatalogImageFile(
  file: File,
  path: (string | number)[],
) {
  await validateCatalogImageFiles([{ file, path }]);
}

export async function validateCatalogImageFiles(
  entries: readonly {
    file: File;
    path: (string | number)[];
  }[],
) {
  const results = await Promise.all(
    entries.map(async ({ file, path }) => ({
      errors: await catalogImageFileErrors(file),
      path,
    })),
  );
  const firstInvalid = results.find(({ errors }) => errors.length > 0);
  if (!firstInvalid) return;
  throw new z.ZodError(
    firstInvalid.errors.map((message) => ({
      code: "custom",
      path: firstInvalid.path,
      message,
    })),
  );
}

export function validateCatalogImageBatch(
  files: readonly File[],
  path: (string | number)[] = ["images"],
) {
  const issues: ConstructorParameters<typeof z.ZodError>[0] =
    catalogImageBatchErrors(files).map((message) => ({
      code: "custom",
      path,
      message,
    }));
  if (issues.length) throw new z.ZodError(issues);
}

export const catalogProductNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(CATALOG_PRODUCT_NAME_MAX_LENGTH);

export const catalogProductDescriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(CATALOG_PRODUCT_DESCRIPTION_MAX_LENGTH);

export const catalogVariantColorSchema = z
  .string()
  .trim()
  .min(1)
  .max(CATALOG_VARIANT_COLOR_MAX_LENGTH);

export const catalogVariantImageCountSchema = z
  .number()
  .int()
  .nonnegative()
  .max(CATALOG_VARIANT_IMAGE_MAX_COUNT);

export function readVariantImageFiles(
  formData: FormData,
  variantIndex: number,
  imageCount: number,
): File[] {
  catalogVariantImageCountSchema.parse(imageCount);
  const prefix = `variant_${variantIndex}_image_`;
  const expectedKeys = new Set(
    Array.from({ length: imageCount }, (_, index) => `${prefix}${index}`),
  );
  const files: File[] = [];
  formData.forEach((value, key) => {
    if (!key.startsWith(prefix)) return;
    if (!expectedKeys.has(key) || !(value instanceof File) || value.size === 0) {
      throw new z.ZodError([{
        code: "custom",
        message: "Variant image files do not match imageCount",
        path: ["variants", variantIndex, "images"],
      }]);
    }
    files.push(value);
  });
  if (files.length !== imageCount) {
    throw new z.ZodError([{
      code: "custom",
      message: "Variant image files do not match imageCount",
      path: ["variants", variantIndex, "images"],
    }]);
  }
  return files;
}

export function mergeVariantImageUrls(
  existingImages: readonly string[],
  addedImages: readonly string[],
  variantIndex: number,
): string[] {
  const images = Array.from(new Set([...existingImages, ...addedImages]));
  if (images.length > CATALOG_VARIANT_IMAGE_MAX_COUNT) {
    throw new z.ZodError([{
      code: "custom",
      message: `A variant can contain at most ${CATALOG_VARIANT_IMAGE_MAX_COUNT} images`,
      path: ["variants", variantIndex, "images"],
    }]);
  }
  return images;
}
