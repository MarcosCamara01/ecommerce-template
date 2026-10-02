import assert from "node:assert/strict";
import test from "node:test";

import { heroWord } from "./hero-word.ts";

test("hero word picks the distinctive word of a product name", () => {
  assert.equal(heroWord("Basic quarter-zip sweatshirt"), "Quarter-zip");
  assert.equal(heroWord("Henley neck T-shirt"), "Henley");
  assert.equal(heroWord("Washed T-shirt with text prints"), "Washed");
  assert.equal(heroWord("Chenille textured jumper"), "Chenille");
  assert.equal(heroWord("100% linen relaxed fit trousers"), "Linen");
  assert.equal(heroWord("BASIC HOODIE"), "Hoodie");
});

test("hero word falls back to the longest word when all are generic", () => {
  assert.equal(heroWord("Basic T-shirt"), "T-shirt");
});
