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
    dangerouslyAllowLocalIP: allowLocalSupabaseImages,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseImagePattern ? [supabaseImagePattern] : []),
    ],
  },
};

module.exports = nextConfig;
