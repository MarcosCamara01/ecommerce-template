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
