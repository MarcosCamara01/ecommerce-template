import "server-only";

import { cache } from "react";

import { buildBlurSourceUrl, isBlurSupportedImageUrl } from "./blur";

export const getBlurDataURL = cache(async (imageUrl: string) => {
  if (!isBlurSupportedImageUrl(imageUrl)) {
    return null;
  }

  try {
    const response = await fetch(buildBlurSourceUrl(imageUrl), {
      headers: {
        accept: "image/*",
      },
      next: {
        revalidate: 60 * 60 * 24 * 30,
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());

    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
});
