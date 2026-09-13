import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const testAuthSecret = ["test-only", "x".repeat(32)].join("-");

const harness = String.raw`
const { createCatalogProduct, updateCatalogProduct } = await import(
  "./src/lib/catalog-sync/admin-mutations.ts"
);
const { createUserPrincipalForIdentityModule } = await import(
  "./src/lib/identity/principal-authority.ts"
);

const webpHeader = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);
function webpFile(size = webpHeader.length, name = "product.webp") {
  return new File(
    [webpHeader, new Uint8Array(Math.max(0, size - webpHeader.length))],
    name,
    { type: "image/webp" },
  );
}
const image = webpFile();
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

function updateForm() {
  const form = productForm();
  form.set("id", "101");
  form.set(
    "existingMainImage",
    "https://example.invalid/storage/v1/object/public/product-images/existing.webp",
  );
  return form;
}

async function submit(form) {
  const response = await createCatalogProduct(
    { formData: async () => form },
    principal,
  );
  return { status: response.status, body: await response.json() };
}

async function submitUpdate(form) {
  const response = await updateCatalogProduct(
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

const unsupportedMainImage = productForm();
unsupportedMainImage.set(
  "mainImage",
  new File(["text"], "payload.txt", { type: "text/plain" }),
);
unsupportedMainImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
unsupportedMainImage.set("variant_0_image_0", image);

const oversizedMainImage = productForm();
oversizedMainImage.set(
  "mainImage",
  webpFile(3 * 1024 * 1024 + 1, "oversized.webp"),
);
oversizedMainImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
oversizedMainImage.set("variant_0_image_0", image);

const spoofedMainImage = productForm();
spoofedMainImage.set(
  "mainImage",
  new File(["not-a-webp"], "spoofed.webp", { type: "image/webp" }),
);
spoofedMainImage.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
spoofedMainImage.set("variant_0_image_0", image);

const oversizedImageBatch = productForm();
oversizedImageBatch.set("mainImage", webpFile(2 * 1024 * 1024, "main.webp"));
oversizedImageBatch.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
oversizedImageBatch.set(
  "variant_0_image_0",
  webpFile(2 * 1024 * 1024, "variant.webp"),
);

const unsupportedUpdateVariant = updateForm();
unsupportedUpdateVariant.set("mainImage", image);
unsupportedUpdateVariant.set(
  "variants",
  JSON.stringify([{
    color: "Blue",
    sizes: ["M"],
    imageCount: 1,
    existingImages: [],
    removedImages: [],
  }]),
);
unsupportedUpdateVariant.set(
  "variant_0_image_0",
  new File(["text"], "payload.txt", { type: "text/plain" }),
);

console.log(JSON.stringify({
  missingMainImage: await submit(missingMainImage),
  missingVariantImage: await submit(missingVariantImage),
  omittedDeclaredVariantImage: await submit(omittedDeclaredVariantImage),
  emptyDeclaredVariantImage: await submit(emptyDeclaredVariantImage),
  unsupportedMainImage: await submit(unsupportedMainImage),
  oversizedMainImage: await submit(oversizedMainImage),
  spoofedMainImage: await submit(spoofedMainImage),
  oversizedImageBatch: await submit(oversizedImageBatch),
  unsupportedUpdateVariant: await submitUpdate(unsupportedUpdateVariant),
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
        BETTER_AUTH_SECRET: testAuthSecret,
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
    unsupportedMainImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: { img: ["Image must be JPEG, PNG, or WebP"] },
      },
    },
    oversizedMainImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: { img: ["Image must be 3 MiB or smaller"] },
      },
    },
    spoofedMainImage: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: {
          img: [
            "Image contents must match its declared JPEG, PNG, or WebP type",
          ],
        },
      },
    },
    oversizedImageBatch: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: {
          images: ["New images must total 3 MiB or less per submission"],
        },
      },
    },
    unsupportedUpdateVariant: {
      status: 400,
      body: {
        error: "Invalid product payload",
        errors: {
          "variants.0.images": ["Image must be JPEG, PNG, or WebP"],
        },
      },
    },
  });
});
