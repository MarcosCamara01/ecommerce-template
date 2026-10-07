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
    // AVIF is offered first; WebP is the fallback.
    formats: ["image/avif", "image/webp"],
    // A photo with no quality of its own takes the first; 90 fills a screen.
    qualities: [85, 90],
    ttl: 31 * 24 * 60 * 60,
  });
});

test("no remote image host is open at every path", () => {
  // The optimizer resizes, and bills, whatever a pattern lets through.
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
