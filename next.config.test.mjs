import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("the configured Supabase origin is allowed for Storage images", () => {
  const output = execFileSync(
    process.execPath,
    [
      "-e",
      `process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:4200";
       const config = require("./next.config.js");
       process.stdout.write(JSON.stringify({
         pattern: config.images.remotePatterns.at(-1),
         allowLocalIP: config.images.dangerouslyAllowLocalIP,
       }));`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.deepEqual(JSON.parse(output), {
    pattern: {
      protocol: "http",
      hostname: "localhost",
      port: "4200",
      pathname: "/storage/v1/object/public/**",
    },
    allowLocalIP: true,
  });
});

test("photos are served as AVIF or WebP, at photo quality, and cached for a month", () => {
  const output = execFileSync(
    process.execPath,
    [
      "-e",
      `const { images } = require("./next.config.js");
       process.stdout.write(JSON.stringify({
         formats: images.formats,
         qualities: images.qualities,
         ttl: images.minimumCacheTTL,
       }));`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.deepEqual(JSON.parse(output), {
    formats: ["image/avif", "image/webp"],
    qualities: [85, 90],
    ttl: 31 * 24 * 60 * 60,
  });
});

function headerRules(env) {
  const output = execFileSync(
    process.execPath,
    [
      "-e",
      `const config = require("./next.config.js");
       config.headers().then((rules) => {
         process.stdout.write(JSON.stringify(rules.map((rule) => ({
           source: rule.source,
           headers: Object.fromEntries(rule.headers.map((h) => [h.key, h.value])),
         }))));
       });`,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        ...env,
      },
    },
  );
  return JSON.parse(output);
}

function contentSecurityPolicy(env) {
  const [rule] = headerRules(env);
  return Object.fromEntries(
    rule.headers["Content-Security-Policy"]
      .split(";")
      .map((directive) => directive.trim().split(/\s+/))
      .map(([name, ...sources]) => [name, sources]),
  );
}

test("every response refuses framing and sends the defensive headers", () => {
  const [rule, ...rest] = headerRules();
  assert.equal(rest.length, 0);
  assert.equal(rule.source, "/:path*");
  assert.match(rule.headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.equal(rule.headers["X-Frame-Options"], "DENY");
  assert.equal(rule.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(rule.headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.ok(rule.headers["Permissions-Policy"]);
  assert.equal(rule.headers["Cross-Origin-Opener-Policy"], "same-origin");
});

test("in production, scripts, styles, fonts, requests and form posts stay on the store's origin", () => {
  assert.deepEqual(contentSecurityPolicy(), {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  });
});

test("only development allows eval and Vercel's debug scripts", () => {
  const policy = contentSecurityPolicy({ NODE_ENV: "development", VERCEL_ENV: "" });
  assert.deepEqual(policy["script-src"], [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://va.vercel-scripts.com",
  ]);
  assert.deepEqual(policy["connect-src"], ["'self'"]);
});

test("only a Preview deployment lets the Vercel toolbar load", () => {
  const preview = contentSecurityPolicy({ VERCEL_ENV: "preview" });
  assert.deepEqual(preview["script-src"], ["'self'", "'unsafe-inline'", "https://vercel.live"]);
  assert.deepEqual(preview["frame-src"], ["'self'", "https://vercel.live"]);
  assert.deepEqual(preview["connect-src"], [
    "'self'",
    "https://vercel.live",
    "wss://ws-us3.pusher.com",
  ]);
  assert.deepEqual(preview["frame-ancestors"], ["'none'"]);
});

test("no remote image host is open at every path", () => {
  const output = execFileSync(
    process.execPath,
    [
      "-e",
      `process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
       const { images } = require("./next.config.js");
       const { hasRemoteMatch } = require("next/dist/shared/lib/match-remote-pattern");
       const allowed = (url) => hasRemoteMatch([], images.remotePatterns, new URL(url));
       process.stdout.write(JSON.stringify({
         pathnames: images.remotePatterns.map((pattern) => pattern.pathname),
         photo: allowed("https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80"),
         premium: allowed("https://images.unsplash.com/premium_photo-1675186049409-f9f8f60ebb5e"),
         avatar: allowed("https://images.unsplash.com/profile-1441298803695-accd94000cac"),
         storage: allowed("https://project.supabase.co/storage/v1/object/public/products/a.jpg"),
         api: allowed("https://project.supabase.co/auth/v1/user"),
       }));`,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.deepEqual(JSON.parse(output), {
    pathnames: ["/photo-*", "/premium_photo-*", "/storage/v1/object/public/**"],
    photo: true,
    premium: true,
    avatar: false,
    storage: true,
    api: false,
  });
});
