import { z } from "zod";

export const CATALOG_PRODUCT_NAME_MAX_LENGTH = 255;
export const CATALOG_VARIANT_COLOR_MAX_LENGTH = 100;
export const CATALOG_VARIANT_IMAGE_MAX_COUNT = 8;

export const catalogProductNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(CATALOG_PRODUCT_NAME_MAX_LENGTH);

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
