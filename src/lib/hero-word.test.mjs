import assert from "node:assert/strict";
import test from "node:test";

import { heroLetters, heroWord } from "./hero-word.ts";

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

test("a Latin, Greek or Cyrillic hero word rises letter by letter, in capitals", () => {
  assert.deepEqual(heroLetters("Quarter-zip"), ["Q", "U", "A", "R", "T", "E", "R", "-", "Z", "I", "P"]);
  assert.deepEqual(heroLetters("Свитер"), ["С", "В", "И", "Т", "Е", "Р"]);
  // A decomposed accent stays on its letter.
  assert.deepEqual(heroLetters("Cafe\u0301"), ["C", "A", "F", "E\u0301"]);
});

test("a hero word in a joined or wide script rises as one run", () => {
  for (const word of ["بأكمام", "स्वेटशर्ट", "เสื้อยืด", "连帽卫衣"]) {
    assert.deepEqual(heroLetters(word), [word]);
  }
});

test("without Intl.Segmenter a Latin hero word still rises letter by letter", async () => {
  const { Segmenter } = Intl;
  delete Intl.Segmenter;
  try {
    const { heroLetters: fallback } = await import("./hero-word.ts?without-segmenter");
    assert.deepEqual(fallback("Hoodie"), ["H", "O", "O", "D", "I", "E"]);
  } finally {
    Intl.Segmenter = Segmenter;
  }
});
