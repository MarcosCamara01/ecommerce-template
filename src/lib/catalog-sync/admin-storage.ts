import { randomUUID } from "node:crypto";

import type { CatalogVariantDraft } from "./model";
import {
  mergeVariantImageUrls,
  readVariantImageFiles,
} from "./input-validation";
import { removeStorageObjectOrThrow } from "./storage-compensation";
import type { CatalogVariantInput } from "./admin-input";
import { variantImageRequiredError } from "./admin-errors";
import { createStorageAdminClient } from "@/lib/storage/supabase";

const BUCKET = "product-images";

const normalizeColor = (color: string) =>
  color
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

function imageExtension(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return extension || "bin";
}

export function randomStoragePath(prefix: string, file: File) {
  return prefix + "/" + randomUUID() + "." + imageExtension(file);
}

export function publicImageUrl(path: string) {
  return createStorageAdminClient()
    .storage.from(BUCKET)
    .getPublicUrl(path).data.publicUrl;
}

export async function uploadImage(file: File, path: string, upsert = false) {
  const storage = createStorageAdminClient();
  const { error } = await storage.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert,
  });
  if (error) return null;
  return storage.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteImage(url: string) {
  const marker = "/storage/v1/object/public/" + BUCKET + "/";
  const path = url.split(marker)[1];
  if (path) {
    const storage = createStorageAdminClient().storage.from(BUCKET);
    await removeStorageObjectOrThrow(path, (paths) => storage.remove(paths));
  }
}

export async function buildVariants(
  formData: FormData,
  inputs: CatalogVariantInput[],
  productId: number,
  uploads: string[],
): Promise<CatalogVariantDraft[]> {
  const drafts: CatalogVariantDraft[] = [];
  for (let index = 0; index < inputs.length; index += 1) {
    const variant = inputs[index];
    const added: string[] = [];
    const variantFiles = readVariantImageFiles(
      formData,
      index,
      variant.imageCount ?? 0,
    );
    const settled = await Promise.allSettled(
      variantFiles.map((file) =>
        uploadImage(
          file,
          randomStoragePath(
            "products/" +
              productId +
              "/variants/" +
              normalizeColor(variant.color),
            file,
          ),
        ),
      ),
    );
    // Record every object that did reach storage before reporting the failure:
    // `uploads` is the compensation ledger, so a URL missing from it is an
    // orphaned object nobody will ever clean up.
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) {
        added.push(result.value);
        uploads.push(result.value);
      }
    }
    if (added.length !== variantFiles.length) {
      throw new Error("Error uploading image for variant " + variant.color);
    }
    const images = mergeVariantImageUrls(
      variant.id ? (variant.existingImages ?? []) : [],
      added,
      index,
    );
    if (!images.length) {
      throw variantImageRequiredError(index, variant.color);
    }
    drafts.push({
      id: variant.id,
      color: variant.color,
      sizes: variant.sizes,
      images,
    });
  }
  return drafts;
}
