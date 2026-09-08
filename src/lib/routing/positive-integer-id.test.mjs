import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parsePositiveIntegerId } from "./positive-integer-id.ts";

test("route identifiers accept only positive safe decimal integers", () => {
  assert.equal(parsePositiveIntegerId("1"), 1);
  assert.equal(parsePositiveIntegerId("101"), 101);
  assert.equal(
    parsePositiveIntegerId(String(Number.MAX_SAFE_INTEGER)),
    Number.MAX_SAFE_INTEGER,
  );

  for (const value of [
    "",
    "0",
    "-1",
    "1.5",
    "not-a-number",
    "1e2",
    " 1",
    String(Number.MAX_SAFE_INTEGER + 1),
  ]) {
    assert.equal(parsePositiveIntegerId(value), null, value);
  }
});

test("product and order detail routes reject invalid ids before data access", async () => {
  const [productPage, orderPage] = await Promise.all([
    readFile("src/app/(store)/[category]/[id]/page.tsx", "utf8"),
    readFile("src/app/(user)/orders/[id]/page.tsx", "utf8"),
  ]);

  assert.match(productPage, /parsePositiveIntegerId\(id\)/);
  assert.match(orderPage, /parsePositiveIntegerId\(id\)/);
  assert.doesNotMatch(productPage, /getProduct\(Number\(id\)\)/);
  assert.doesNotMatch(orderPage, /getOrder\(Number\(id\)\)/);
});
