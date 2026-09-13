import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("successful sign-up keeps the session and follows callbackURL", () => {
  assert.doesNotMatch(source, /check-email/);
  assert.match(source, /return redirectWithCookies\(\s*callbackURL,\s*upstream/);
});
