import assert from "node:assert/strict";
import test from "node:test";

import {
  IDENTITY,
  counterTransform,
  drawnBox,
  inversion,
  layoutBox,
  parseMatrix,
  sameBox,
  toTransform,
} from "./flip.ts";

const box = (left, top, width, height) => ({ left, top, width, height });

test("a piece that changed place and size is drawn back where it was", () => {
  // Four columns to three: the tile grows and moves to the next row.
  const from = box(1076, 403, 332, 443);
  const to = box(32, 1087, 448, 597);
  const invert = inversion(from, to, "morph");
  assert.deepEqual(
    drawnBox(to, { a: invert.scaleX, d: invert.scaleY, e: invert.x, f: invert.y }),
    from,
  );
  assert.equal(
    toTransform(invert),
    `translate(1044px, -684px) scale(${332 / 448}, ${443 / 597})`,
  );
});

test("text follows its corner and never stretches", () => {
  const invert = inversion(box(1080, 858, 250, 48), box(36, 1012, 366, 48), "move");
  assert.deepEqual(invert, { x: 1044, y: -154, scaleX: 1, scaleY: 1 });
});

test("a piece that did not move has nothing to undo", () => {
  assert.equal(inversion(box(32, 403, 332, 443), box(32.2, 403.1, 332, 443), "morph"), null);
  assert.equal(sameBox(box(0, 0, 100, 100), box(0.4, 0, 100.4, 100)), true);
  assert.equal(sameBox(box(0, 0, 100, 100), box(0.6, 0, 100, 100)), false);
});

test("a change mid-flight starts from where the piece is drawn", () => {
  // Half way through a flight the element carries a transform over its
  // layout box; the page has just laid it out somewhere else.
  const before = box(960, 403, 448, 597);
  const flight = parseMatrix("matrix(0.8, 0, 0, 0.8, -200, 10)");
  const drawnNow = drawnBox(before, flight);
  assert.deepEqual(drawnNow, box(760, 413, 448 * 0.8, 597 * 0.8));

  // What the browser reports after the new layout, with the old transform
  // still applied, gives the new layout box back.
  const laidOut = box(32, 1087, 448, 597);
  assert.deepEqual(layoutBox(drawnBox(laidOut, flight), flight), laidOut);

  // The new flight starts exactly where the old one left the piece.
  const invert = inversion(drawnNow, laidOut, "morph");
  const startsAt = drawnBox(laidOut, {
    a: invert.scaleX,
    d: invert.scaleY,
    e: invert.x,
    f: invert.y,
  });
  for (const side of ["left", "top", "width", "height"]) {
    assert.ok(Math.abs(startsAt[side] - drawnNow[side]) < 1e-9, side);
  }
});

test("the heart on a tile keeps its size while the tile scales", () => {
  const invert = inversion(box(0, 0, 332, 443), box(0, 0, 448, 597), "morph");
  const [, sx, sy] = /scale\(([^,]+), ([^)]+)\)/.exec(counterTransform(invert));
  assert.ok(Math.abs(Number(sx) * invert.scaleX - 1) < 1e-12);
  assert.ok(Math.abs(Number(sy) * invert.scaleY - 1) < 1e-12);
});

test("computed transforms are read, and anything else counts as none", () => {
  assert.deepEqual(parseMatrix("none"), IDENTITY);
  assert.deepEqual(parseMatrix("matrix(1, 0, 0, 1, 0, 12)"), { a: 1, d: 1, e: 0, f: 12 });
  assert.deepEqual(parseMatrix("matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)"), IDENTITY);
  // A collapsed scale cannot be undone: treat it as no transform.
  assert.deepEqual(parseMatrix("matrix(0, 0, 0, 0, 5, 5)"), IDENTITY);
});
