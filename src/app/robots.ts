import type { MetadataRoute } from "next";

import { getCanonicalAppOrigin } from "@/lib/app-origin";
import { AUTH_PAGES } from "@/lib/auth/email-flows";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/cart",
        "/wishlist",
        "/orders",
        "/result",
        ...Object.values(AUTH_PAGES),
      ],
    },
    sitemap: new URL("/sitemap.xml", getCanonicalAppOrigin()).href,
  };
}
