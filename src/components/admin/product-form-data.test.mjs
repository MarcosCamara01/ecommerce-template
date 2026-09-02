import assert from "node:assert/strict";
import test from "node:test";

import { encodeProductFormData } from "./product-form-data.ts";

test("catalog multipart encoding is isolated from ProductForm", () => {
  const image = new File(["image"], "item.webp", { type: "image/webp" });
  const form = encodeProductFormData({
    mode: "create",
    commandId: "11111111-1111-4111-8111-111111111111",
    basicInfo: {
      name: "Product",
      description: "Description",
      price: "49.95",
      category: "t-shirts",
    },
    mainImage: image,
    existingMainImage: null,
    variants: [{
      color: "Black",
      sizes: ["M"],
      imageCount: 1,
      existingImages: [],
      removedImages: [],
    }],
    images: { variant_0: [image] },
  });
  assert.equal(form.get("commandId"), "11111111-1111-4111-8111-111111111111");
  assert.equal(form.get("name"), "Product");
  assert.equal(form.get("mainImage"), image);
  assert.equal(form.get("variant_0_image_0"), image);
  assert.deepEqual(JSON.parse(String(form.get("variants"))), [{
    color: "Black",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]);
});
