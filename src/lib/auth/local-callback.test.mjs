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

test("a callback that normalizes to a protocol-relative path fails closed", () => {
  for (const value of [
    "/.//evil.example",
    "/a/..//evil.example/path",
    "/%2e//evil.example",
  ]) {
    const callback = safeLocalCallback(value, origin);
    assert.equal(new URL(callback, origin).origin, origin, value);
    assert.equal(callback, "/", value);
  }
});
