import assert from "node:assert/strict";
import test from "node:test";

import { safeLocalCallback } from "./local-callback.ts";

const origin = "https://shop.example.test";

test("local callbacks preserve path and query", () => {
  assert.equal(
    safeLocalCallback("/orders?from=checkout", origin),
    "/orders?from=checkout",
  );
});

test("external and backslash callbacks fail closed", () => {
  for (const value of [
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "\\evil.example/path",
    "orders",
    "",
    null,
  ]) {
    assert.equal(safeLocalCallback(value, origin), "/", String(value));
  }
});
