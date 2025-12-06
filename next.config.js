const nextConfig = {
  experimental: {
    cacheComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: "https",
              hostname: process.env.NEXT_PUBLIC_SUPABASE_URL.replace(
                "https://",
                ""
              ),
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

module.exports = nextConfig;
