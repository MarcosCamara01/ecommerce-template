// Vercel Functions reject request bodies above 4.5 MB. Catalog mutations send
// every new image in one multipart request, so the complete file batch must
// leave ample room for multipart headers and product metadata.
export const CATALOG_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const CATALOG_IMAGE_BATCH_MAX_BYTES = CATALOG_IMAGE_MAX_BYTES;
export const PRODUCT_IMAGES_BUCKET_MAX_BYTES = 5 * 1024 * 1024;
export const CATALOG_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const CATALOG_IMAGE_ACCEPT = CATALOG_IMAGE_ALLOWED_MIME_TYPES.join(",");
export const CATALOG_IMAGE_HELP_TEXT =
  "JPEG, PNG, or WebP. Each new image and all new images together must be 3 MiB or smaller.";

export function catalogImageExtension(file: Pick<File, "type">) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Unsupported catalog image MIME type");
  }
}

const allowedImageMimeTypes = new Set<string>(
  CATALOG_IMAGE_ALLOWED_MIME_TYPES,
);

type CatalogImageFile = Pick<File, "size" | "slice" | "type">;

function catalogImageMetadataErrors(
  file: Pick<File, "size" | "type">,
): string[] {
  const errors: string[] = [];
  if (!allowedImageMimeTypes.has(file.type)) {
    errors.push("Image must be JPEG, PNG, or WebP");
  }
  if (file.size > CATALOG_IMAGE_MAX_BYTES) {
    errors.push("Image must be 3 MiB or smaller");
  }
  return errors;
}

function detectedCatalogImageMimeType(bytes: Uint8Array) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function catalogImageFileErrors(
  file: CatalogImageFile,
): Promise<string[]> {
  const metadataErrors = catalogImageMetadataErrors(file);
  if (metadataErrors.length) return metadataErrors;

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (detectedCatalogImageMimeType(header) !== file.type) {
    return ["Image contents must match its declared JPEG, PNG, or WebP type"];
  }
  return [];
}

export function catalogImageBatchErrors(
  files: readonly Pick<File, "size">[],
): string[] {
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  return totalBytes > CATALOG_IMAGE_BATCH_MAX_BYTES
    ? ["New images must total 3 MiB or less per submission"]
    : [];
}
