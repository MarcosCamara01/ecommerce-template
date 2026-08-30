import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const harness = String.raw`
const { createCatalogProduct } = await import(
  "./src/lib/catalog-sync/admin-mutations.ts"
);
const { createUserPrincipalForIdentityModule } = await import(
  "./src/lib/identity/principal-authority.ts"
);

const image = new File(["image"], "product.webp", { type: "image/webp" });
const principal = createUserPrincipalForIdentityModule({
  userId: "admin-1",
  role: "admin",
});

function productForm() {
  const form = new FormData();
  form.set("name", "Test product");
  form.set("description", "Description");
  form.set("price", "10.00");
  form.set("category", "t-shirts");
  form.set("commandId", "11111111-1111-4111-8111-111111111111");
  return form;
}

async function submit(form) {
  const response = await createCatalogProduct(
    { formData: async () => form },
    principal,
  );
  return { status: response.status, body: await response.json() };
}

const missingMainImage = productForm();
missingMainImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
missingMainImage.set("variant_0_image_0", image);

const missingVariantImage = productForm();
missingVariantImage.set("mainImage", image);
missingVariantImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 0,
    existingImages: [],
    removedImages: [],
  }]),
);

const omittedDeclaredVariantImage = productForm();
omittedDeclaredVariantImage.set("mainImage", image);
omittedDeclaredVariantImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);

const emptyDeclaredVariantImage = productForm();
emptyDeclaredVariantImage.set("mainImage", image);
emptyDeclaredVariantImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
emptyDeclaredVariantImage.set(
  "variant_0_image_0",
  new File([], "empty.webp", { type: "image/webp" }),
);

console.log(JSON.stringify({
  missingMainImage: await submit(missingMainImage),
  missingVariantImage: await submit(missingVariantImage),
  omittedDeclaredVariantImage: await submit(omittedDeclaredVariantImage),
  emptyDeclaredVariantImage: await submit(emptyDeclaredVariantImage),
}));
`;

test("missing create images return field errors before catalog side effects", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      harness,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://unused:unused@127.0.0.1:1/unused",
        STRIPE_SECRET_KEY: "sk_test_unused",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.invalid",
        SUPABASE_SERVICE_ROLE_KEY: "unused",
        APP_URL: "http://127.0.0.1:3000",
        BETTER_AUTH_URL: "http://127.0.0.1:3000",
        NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
        BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
      },
    },
  );
  const result = JSON.parse(output);

  assert.deepEqual(result, {
    missingMainImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: { img: ["Main image is required"] },
      },
    },
    missingVariantImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: {
          "variants.0.images": ["Variant Blue must include an image"],
        },
      },
    },
    omittedDeclaredVariantImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: {
          "variants.0.images": [
            "Variant image files do not match imageCount",
          ],
        },
      },
    },
    emptyDeclaredVariantImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: {
          "variants.0.images": [
            "Variant image files do not match imageCount",
          ],
        },
      },
    },
  });
});
