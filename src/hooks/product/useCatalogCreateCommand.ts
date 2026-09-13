"use client";

import { useRef } from "react";

import {
  selectCreateCommand,
  serializeCreateCommand,
  type StoredCreateCommand,
} from "@/lib/catalog-sync/create-draft-command";
import type { VariantSubmitData } from "@/types/admin";

const STORAGE_KEY = "admin-product-create-command-id";

const digest = async (value: string | ArrayBuffer) => {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

const fileFingerprint = async (file: File) => ({
  name: file.name,
  size: file.size,
  type: file.type,
  lastModified: file.lastModified,
  contentHash: await digest(await file.arrayBuffer()),
});

export function useCatalogCreateCommand() {
  const commandRef = useRef<StoredCreateCommand | null>(null);

  const prepare = async (input: {
    basicInfo: Record<string, string>;
    mainImage: File | null;
    variants: VariantSubmitData[];
    images: Record<string, File[]>;
  }) => {
    const fingerprint = await digest(
      JSON.stringify({
        ...input.basicInfo,
        mainImage: input.mainImage
          ? await fileFingerprint(input.mainImage)
          : null,
        variants: await Promise.all(
          input.variants.map(async (variant, index) => ({
            ...variant,
            newImages: await Promise.all(
              (input.images[`variant_${index}`] || []).map(fileFingerprint),
            ),
          })),
        ),
      }),
    );
    const stored = commandRef.current
      ? serializeCreateCommand(commandRef.current)
      : sessionStorage.getItem(STORAGE_KEY);
    const command = selectCreateCommand(
      stored,
      fingerprint,
      () => crypto.randomUUID(),
    );
    commandRef.current = command;
    sessionStorage.setItem(STORAGE_KEY, serializeCreateCommand(command));
    return command.id;
  };

  const clear = () => {
    commandRef.current = null;
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return {
    prepare,
    clear,
    getCurrentId: () => commandRef.current?.id,
  };
}
