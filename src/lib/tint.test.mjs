import assert from "node:assert/strict";
import test from "node:test";

import { colorMapping } from "../constants/colors.ts";
import { contrastRatio, tintForColor } from "./tint.ts";

test("canvas-tuned colours keep their exact page tints", () => {
  assert.deepEqual(tintForColor("Navy blue").light, { bg: "#2E3A4F", fg: "#EEF2F7" });
  assert.deepEqual(tintForColor("grey-marl").dark, { bg: "#2A2D31", fg: "#E9EBED" });
  assert.equal(tintForColor("Sky Blue").glassLight, "rgba(255,255,255,0.45)");
  assert.equal(tintForColor("Navy blue").glassLight, "rgba(255,255,255,0.10)");
});

test("every mapped garment colour derives an AA tint in both themes", () => {
  for (const name of Object.keys(colorMapping)) {
    const tint = tintForColor(name);
    assert.ok(contrastRatio(tint.light.bg, tint.light.fg) >= 4.5, `${name} light`);
    assert.ok(contrastRatio(tint.dark.bg, tint.dark.fg) >= 4.5, `${name} dark`);
  }
});

test("unknown colours fall back to the neutral ground", () => {
  assert.deepEqual(tintForColor("Mystery").light, { bg: "#E4E7EA", fg: "#111214" });
});

test("multi-colour names tint from their first colour", () => {
  assert.deepEqual(tintForColor("Navy blue / White"), tintForColor("Navy blue"));
});
