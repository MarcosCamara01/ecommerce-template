import assert from "node:assert/strict";
import test from "node:test";

import { displayLines, fitDisplaySize, fitDisplayStep } from "./display-type.ts";

// The product page: five steps, a column 5.18 times the largest, and room
// for two lines of the largest size.
const STEPS = [
  { px: 104, leading: 0.84 },
  { px: 80, leading: 0.86 },
  { px: 64, leading: 0.88 },
  { px: 56, leading: 0.9 },
  { px: 44, leading: 0.92 },
];
const ROOM = { measureEm: 5.18, budgetPx: 2 * 104 * 0.84 };
const step = (name) => fitDisplayStep(name, STEPS, ROOM).px;

test("display type wraps at spaces and after hyphens", () => {
  assert.equal(displayLines("BAG", 5), 1);
  assert.equal(displayLines("BASIC HOODIE", 5.18), 2);
  // One word wider than the measure breaks after its hyphen.
  assert.equal(displayLines("QUARTER-ZIP", 3), 2);
  // A word wider than the column breaks anywhere, as overflow-wrap does.
  assert.equal(displayLines("SWEATSHIRT", 2), 3);
  assert.ok(displayLines("KAPUZENSWEATSHIRTJACKE", 5.18) >= 3);
});

test("a short product name keeps the giant size", () => {
  assert.equal(step("BASIC HOODIE"), 104);
  assert.equal(step("WASHED ZIP-UP HOODIE"), 104);
});

test("a longer name steps down until it fits in the room of two giant lines", () => {
  assert.equal(step("WIDE LEG RIPPED JEANS"), 80);
  assert.equal(step("PLEATED BAGGY FIT TROUSERS"), 80);
  assert.equal(step("BAGGY FIT JEANS WITH PAINT SPLATTER"), 64);
  assert.equal(step("RETRO FOOTBALL QUARTER-ZIP SWEATSHIRT"), 64);

  for (const name of [
    "BASIC HOODIE",
    "PARACHUTE CARGO TROUSERS",
    "BAGGY FIT JEANS WITH PAINT SPLATTER",
    "VARSITY SWEATSHIRT WITH CHENILLE PATCH",
  ]) {
    const chosen = fitDisplayStep(name, STEPS, ROOM);
    const lines = displayLines(name, (ROOM.measureEm * 104) / chosen.px);
    assert.ok(
      lines * chosen.px * chosen.leading <= ROOM.budgetPx,
      `${name} at ${chosen.px}px takes ${lines} lines`,
    );
  }
});

test("an unbreakable word steps the name down like a long name does", () => {
  assert.ok(step("KAPUZENSWEATSHIRTJACKE") < 104);
});

test("CJK glyphs measure about one em each", () => {
  // Four glyphs at 1em, plus the 3% margin, fill 412px at 100px.
  const size = fitDisplaySize("连帽卫衣", { maxPx: 1000, budgetPx: 412, vwBudget: 100 });
  assert.match(size, /^min\(100px, /);
});

test("a name too long for every step takes the smallest", () => {
  assert.equal(step("A VERY LONG NAME ".repeat(8)), 44);
});
