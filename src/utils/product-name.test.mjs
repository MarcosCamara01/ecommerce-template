import assert from "node:assert/strict";
import test from "node:test";

import { displayName } from "./product-name.ts";

test("all-caps catalogue names read as sentence case", () => {
  assert.equal(displayName("BASIC QUARTER-ZIP SWEATSHIRT"), "Basic quarter-zip sweatshirt");
  assert.equal(displayName("HENLEY NECK T-SHIRT"), "Henley neck T-shirt");
  assert.equal(displayName("100% LINEN RELAXED FIT TROUSERS"), "100% linen relaxed fit trousers");
});

test("names with their own casing are untouched", () => {
  assert.equal(displayName("Henley neck T-shirt"), "Henley neck T-shirt");
});
