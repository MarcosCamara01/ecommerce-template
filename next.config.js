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

const contentSecurityPolicy = [
  {
    "default-src": ["'self'"],
    // The App Router streams each page's RSC payload in inline scripts. Cache
    // Components prerender pages once, so there is no per-request nonce, and
    // no hash covers payloads that differ per page.
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  },
  // React needs eval for its dev-only stack traces, and Vercel Analytics
  // and Speed Insights load their debug scripts from Vercel's CDN.
  process.env.NODE_ENV === "development" && {
    "script-src": ["'unsafe-eval'", "https://va.vercel-scripts.com"],
  },
  // Vercel injects its toolbar into Preview deployments.
  process.env.VERCEL_ENV === "preview" && {
    "script-src": ["https://vercel.live"],
    "style-src": ["https://vercel.live"],
    "img-src": ["https://vercel.live", "https://vercel.com", "blob:"],
    "font-src": ["https://vercel.live", "https://assets.vercel.com"],
    "connect-src": ["https://vercel.live", "wss://ws-us3.pusher.com"],
    "frame-src": ["'self'", "https://vercel.live"],
  },
]
  .filter(Boolean)
  .reduce((policy, layer) => {
    for (const [directive, sources] of Object.entries(layer)) {
      policy[directive] = [...(policy[directive] ?? []), ...sources];
    }
    return policy;
  }, {});

// Sent on every response. No page of the store is ever shown inside a frame,
// so framing is refused everywhere: a page that hides the admin or the bag
// under its own buttons can no longer turn a click into an action here.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: Object.entries(contentSecurityPolicy)
      .map(([directive, sources]) => [directive, ...sources].join(" "))
      .join("; "),
  },
  // frame-ancestors for browsers that predate it.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The result page carries the Checkout Session id in its query string;
  // another origin gets the store's origin and nothing after it.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Payment happens on Stripe's own page, so the store asks for none of these.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Google sign-in and Stripe Checkout are full-page redirects, not popups.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  cacheComponents: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    // AVIF first, WebP for browsers without it. On the catalogue photos AVIF
    // is about a third lighter than WebP at the same fidelity.
    formats: ["image/avif", "image/webp"],
    // The photos are the product. A photo with no quality gets 85, the entry
    // closest to Next's default of 75; at AVIF, 85 matches what WebP gave at
    // 75, in less weight. 90 is for a photo that fills the screen.
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
