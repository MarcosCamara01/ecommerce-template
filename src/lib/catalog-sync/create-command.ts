import "server-only";

import { createHash } from "node:crypto";

import {
  CatalogSyncError,
  type CatalogProductDraft,
  type CatalogVariantDraft,
} from "./model";
/*
 * This module owns deterministic command planning. The route only adapts
 * multipart input and Storage URLs into this domain boundary.
 */
import type {
  ProductSize,
} from "../db/drizzle/schema";
import { catalogImageExtension } from "./image-file-contract";

export type CatalogCreateUpload = {
  file: File;
  path: string;
  url: string;
};

type CatalogCreateVariantInput = {
  id?: number;
  color: string;
  sizes: ProductSize[];
  files: File[];
};

type PlanCatalogCreateCommandInput = {
  commandId: string;
  product: Omit<CatalogProductDraft, "img">;
  mainImage: File;
  variants: CatalogCreateVariantInput[];
  publicUrlForPath: (path: string) => string;
};

function createUpload(
  file: File,
  path: string,
  publicUrlForPath: (path: string) => string,
): CatalogCreateUpload {
  return { file, path, url: publicUrlForPath(path) };
}

async function requestHash(input: {
  product: CatalogProductDraft;
  variants: CatalogVariantDraft[];
  uploads: CatalogCreateUpload[];
}) {
  const files = await Promise.all(
    input.uploads.map(async (upload) => ({
      path: upload.path,
      size: upload.file.size,
      type: upload.file.type,
      sha256: createHash("sha256")
        .update(new Uint8Array(await upload.file.arrayBuffer()))
        .digest("hex"),
    })),
  );
  return createHash("sha256")
    .update(
      JSON.stringify({
        product: input.product,
        variants: input.variants,
        files,
      }),
    )
    .digest("hex");
}

export async function planCatalogCreateCommand(
  input: PlanCatalogCreateCommandInput,
) {
  if (!input.mainImage.size) {
    throw new CatalogSyncError("invalid_target", "Main image is required");
  }

  const mainUpload = createUpload(
    input.mainImage,
    `products/${input.commandId}/main.${catalogImageExtension(input.mainImage)}`,
    input.publicUrlForPath,
  );
  const uploads = [mainUpload];
  const variants: CatalogVariantDraft[] = input.variants.map(
    (variant, variantIndex) => {
      if (variant.id !== undefined) {
        throw new CatalogSyncError(
          "invalid_target",
          "New product variants cannot reference an existing identity",
        );
      }
      const images = variant.files.map((file, imageIndex) => {
        const upload = createUpload(
          file,
          `products/${input.commandId}/variants/${variantIndex}/image-${imageIndex}.${catalogImageExtension(file)}`,
          input.publicUrlForPath,
        );
        uploads.push(upload);
        return upload.url;
      });
      if (!images.length) {
        throw new CatalogSyncError(
          "invalid_target",
          `Variant ${variant.color} must include an image`,
        );
      }
      return {
        color: variant.color,
        sizes: variant.sizes,
        images,
      };
    },
  );
  const product = { ...input.product, img: mainUpload.url };

  return {
    product,
    variants,
    uploads,
    requestHash: await requestHash({ product, variants, uploads }),
  };
}
