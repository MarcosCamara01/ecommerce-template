import assert from "node:assert/strict";
import test from "node:test";
import { UpdateProfileSchema } from "./auth.ts";

test("profile names are validated after trimming whitespace", () => {
  for (const name of ["", "   ", " a "]) {
    assert.equal(UpdateProfileSchema.safeParse({ name }).success, false);
  }
  assert.deepEqual(UpdateProfileSchema.parse({ name: "  Ada  " }), {
    name: "Ada",
  });
});
