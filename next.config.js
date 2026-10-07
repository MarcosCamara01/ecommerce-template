const getSupabaseImagePattern = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const origin = new URL(url);
    const protocol = origin.protocol.slice(0, -1);
    if (protocol !== "http" && protocol !== "https") return null;
    return {
      protocol,
      hostname: origin.hostname,
      ...(origin.port ? { port: origin.port } : {}),
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
};

const supabaseImagePattern = getSupabaseImagePattern();
const allowLocalSupabaseImages = Boolean(
  supabaseImagePattern &&
    ["localhost", "127.0.0.1", "[::1]"].includes(
      supabaseImagePattern.hostname,
    ),
);

const nextConfig = {
  cacheComponents: true,
  images: {
    // AVIF first, WebP for browsers without it. On the catalogue photos AVIF
    // is about a third lighter than WebP at the same fidelity.
    formats: ["image/avif", "image/webp"],
    // The photos are the product. 85 is the default for every photo (at
    // AVIF it matches what WebP gave at 75, the framework default, in less
    // weight); 90 is for a photo that fills the screen.
    qualities: [85, 90],
    // A photo never changes under its URL (uploads get a random name), so
    // browsers and the optimizer's cache can keep each size for a month.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    dangerouslyAllowLocalIP: allowLocalSupabaseImages,
    // No host is open at every path: the optimizer resizes whatever a
    // pattern lets through, and each new image is billed. Unsplash serves
    // its photos at /photo-<id> (and /premium_photo-<id>).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/photo-*",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/premium_photo-*",
      },
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
    ],
  },
};

module.exports = nextConfig;
