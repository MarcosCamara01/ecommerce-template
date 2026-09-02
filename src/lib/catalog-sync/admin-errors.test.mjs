import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";

import {
  fieldErrorsFromZod,
  mainImageRequiredError,
  variantImageRequiredError,
} from "./admin-errors.ts";

test("nested variant validation retains its exact field path", () => {
  const schema = z.object({
    variants: z.array(z.object({
      color: z.string().min(1, "Color is required"),
      sizes: z.array(z.string()).min(1, "Choose at least one size"),
    })),
  });
  const result = schema.safeParse({ variants: [{ color: "", sizes: [] }] });
  assert.equal(result.success, false);
  assert.deepEqual(fieldErrorsFromZod(result.error), {
    "variants.0.color": ["Color is required"],
    "variants.0.sizes": ["Choose at least one size"],
  });
});

test("missing final variant image is a field validation error", () => {
  const error = variantImageRequiredError(2, "Blue");
  assert.deepEqual(fieldErrorsFromZod(error), {
    "variants.2.images": ["Variant Blue must include an image"],
  });
});

test("missing main image uses the field consumed by the admin form", () => {
  assert.deepEqual(fieldErrorsFromZod(mainImageRequiredError()), {
    img: ["Main image is required"],
  });
});
