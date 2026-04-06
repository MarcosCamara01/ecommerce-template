const DEFAULT_BLUR_WIDTH = 24;
const DEFAULT_BLUR_QUALITY = 20;

function getSupabaseHostname() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const SUPABASE_HOSTNAME = getSupabaseHostname();
const ALLOWED_BLUR_HOSTNAMES = new Set(
  [SUPABASE_HOSTNAME, "images.unsplash.com"].filter(
    (value): value is string => Boolean(value),
  ),
);

export function isBlurSupportedImageUrl(imageUrl: string) {
  try {
    const parsedUrl = new URL(imageUrl);
    return ALLOWED_BLUR_HOSTNAMES.has(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function buildBlurSourceUrl(imageUrl: string) {
  const parsedUrl = new URL(imageUrl);

  if (
    SUPABASE_HOSTNAME &&
    parsedUrl.hostname === SUPABASE_HOSTNAME &&
    parsedUrl.pathname.startsWith("/storage/v1/object/public/")
  ) {
    parsedUrl.pathname = parsedUrl.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    parsedUrl.search = "";
    parsedUrl.searchParams.set("width", String(DEFAULT_BLUR_WIDTH));
    parsedUrl.searchParams.set("quality", String(DEFAULT_BLUR_QUALITY));
    parsedUrl.searchParams.set("resize", "contain");

    return parsedUrl.toString();
  }

  if (parsedUrl.hostname === "images.unsplash.com") {
    parsedUrl.searchParams.set("w", String(DEFAULT_BLUR_WIDTH));
    parsedUrl.searchParams.set("q", String(DEFAULT_BLUR_QUALITY));
    parsedUrl.searchParams.set("fit", "max");
    parsedUrl.searchParams.set("auto", "format");

    return parsedUrl.toString();
  }

  return parsedUrl.toString();
}
