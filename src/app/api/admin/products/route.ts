import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { revalidateProducts } from "@/app/actions";
import { productsRepository } from "@/lib/db/drizzle/repositories";
import {
  type InsertProductVariant,
  ProductCategoryZod,
  ProductSizeZod,
} from "@/lib/db/drizzle/schema";
import { createServiceClient } from "@/lib/db/supabase/server";
import {
  archiveStripeProduct,
  createStripeProductForVariant,
  deactivateStripePrice,
  updateStripeProduct,
} from "@/services/stripe.service";
import { auth } from "@/utils/auth";

const BUCKET = "product-images";

type ProcessedVariant = Omit<InsertProductVariant, "productId"> & {
  id?: number;
};

type BuildVariantsTracker = {
  uploadedImageUrls: string[];
  newVariantStripePriceIds: string[];
  replacementStripePriceIds: string[];
  previousStripePriceIdsToDeactivate: string[];
};

const productIdSchema = z.coerce.number().int().positive();

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category: ProductCategoryZod,
});

const variantFormSchema = z.object({
  id: z.number().int().positive().optional(),
  color: z.string().trim().min(1, "Color is required"),
  stripe_id: z.string().optional().default(""),
  sizes: z.array(ProductSizeZod).min(1, "At least one size is required"),
  imageCount: z.number().int().nonnegative().optional(),
  existingImages: z.array(z.string()).optional(),
  removedImages: z.array(z.string()).optional(),
});

type VariantFormInput = z.infer<typeof variantFormSchema>;

function validationErrorResponse(error: z.ZodError, message: string) {
  return NextResponse.json(
    {
      error: message,
      errors: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

async function verifyAdmin(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user || !adminEmail || session.user.email !== adminEmail) {
    return null;
  }

  return session.user;
}

function parseVariantsData(rawVariants: FormDataEntryValue | null): VariantFormInput[] {
  if (typeof rawVariants !== "string") {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Variants are required",
        path: ["variants"],
      },
    ]);
  }

  let parsedVariants: unknown;

  try {
    parsedVariants = JSON.parse(rawVariants);
  } catch {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Invalid variants payload",
        path: ["variants"],
      },
    ]);
  }

  return z
    .array(variantFormSchema)
    .min(1, "At least one variant is required")
    .parse(parsedVariants);
}

function normalizeColorPath(color: string) {
  return color.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function uploadImage(file: File, path: string): Promise<string | null> {
  const supabase = createServiceClient();

  const ext = file.name.split(".").pop();
  const name = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const fullPath = `${path}/${name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Error uploading image:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);

  return publicUrl;
}

async function deleteImageByUrl(imageUrl: string) {
  const supabase = createServiceClient();
  const urlParts = imageUrl.split(`/storage/v1/object/public/${BUCKET}/`);
  if (urlParts.length < 2) return;

  const path = urlParts[1];
  await supabase.storage.from(BUCKET).remove([path]);
}

async function cleanupProductImages(productId: number) {
  try {
    const supabase = createServiceClient();
    const productPath = `products/${productId}`;
    const paths: string[] = [];

    const { data: rootEntries } = await supabase.storage
      .from(BUCKET)
      .list(productPath, { limit: 100 });

    for (const entry of rootEntries ?? []) {
      if (entry.name === "variants") {
        continue;
      }

      paths.push(`${productPath}/${entry.name}`);
    }

    const { data: variantFolders } = await supabase.storage
      .from(BUCKET)
      .list(`${productPath}/variants`, { limit: 100 });

    for (const folder of variantFolders ?? []) {
      const variantFolderPath = `${productPath}/variants/${folder.name}`;
      const { data: variantFiles } = await supabase.storage
        .from(BUCKET)
        .list(variantFolderPath, { limit: 100 });

      for (const file of variantFiles ?? []) {
        paths.push(`${variantFolderPath}/${file.name}`);
      }
    }

    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch (error) {
    console.error("Error cleaning product images:", error);
  }
}

function dedupeStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}

async function cleanupExternalResources({
  imageUrls = [],
  archivePriceIds = [],
  deactivatePriceIds = [],
}: {
  imageUrls?: string[];
  archivePriceIds?: string[];
  deactivatePriceIds?: string[];
}) {
  const tasks: Promise<void>[] = [];

  for (const imageUrl of dedupeStrings(imageUrls)) {
    tasks.push(
      deleteImageByUrl(imageUrl).catch((error) => {
        console.error("Error deleting image during cleanup:", error);
      }),
    );
  }

  for (const priceId of dedupeStrings(archivePriceIds)) {
    tasks.push(
      archiveStripeProduct(priceId).then((archived) => {
        if (!archived) {
          console.error(`Could not archive Stripe product for price ${priceId}`);
        }
      }),
    );
  }

  for (const priceId of dedupeStrings(deactivatePriceIds)) {
    tasks.push(
      deactivateStripePrice(priceId).then((deactivated) => {
        if (!deactivated) {
          console.error(`Could not deactivate Stripe price ${priceId}`);
        }
      }),
    );
  }

  await Promise.all(tasks);
}

async function safeRevalidateProducts(productId?: number) {
  try {
    await revalidateProducts(productId);
  } catch (error) {
    console.error("Error revalidating products:", error);
  }
}

async function buildVariants({
  formData,
  variantsData,
  productId,
  productName,
  description,
  price,
  category,
  tracker,
}: {
  formData: FormData;
  variantsData: VariantFormInput[];
  productId: number;
  productName: string;
  description: string;
  price: number;
  category: z.infer<typeof ProductCategoryZod>;
  tracker: BuildVariantsTracker;
}): Promise<ProcessedVariant[]> {
  return Promise.all(
    variantsData.map(async (variant, idx) => {
      const existingImages = variant.existingImages ?? [];
      const newImages: string[] = [];
      const colorPath = normalizeColorPath(variant.color);

      for (let i = 0; i < (variant.imageCount ?? 0); i++) {
        const file = formData.get(`variant_${idx}_image_${i}`);
        if (file instanceof File && file.size > 0) {
          const url = await uploadImage(
            file,
            `products/${productId}/variants/${colorPath}`,
          );
          if (!url) {
            throw new Error(
              `Error uploading image ${i + 1} for variant ${variant.color}`,
            );
          }
          newImages.push(url);
          tracker.uploadedImageUrls.push(url);
        }
      }

      const images = variant.id ? [...existingImages, ...newImages] : newImages;

      if (images.length === 0) {
        throw new Error(`Variant ${variant.color} must include at least one image`);
      }

      let stripeId = variant.stripe_id;
      if (variant.id && stripeId) {
        const updatedStripe = await updateStripeProduct(stripeId, {
          productName,
          variantColor: variant.color,
          description,
          price,
          images,
          metadata: {
            product_id: productId.toString(),
            category,
          },
        });

        if (!updatedStripe) {
          throw new Error(`Error updating Stripe product for variant ${variant.color}`);
        }

        stripeId = updatedStripe.priceId;

        if (updatedStripe.replacedPriceId) {
          tracker.replacementStripePriceIds.push(updatedStripe.priceId);
          tracker.previousStripePriceIdsToDeactivate.push(
            updatedStripe.replacedPriceId,
          );
        }
      } else if (!stripeId || stripeId.trim() === "") {
        const stripeResult = await createStripeProductForVariant({
          productName,
          variantColor: variant.color,
          description,
          price,
          images,
          metadata: {
            product_id: productId.toString(),
            category,
          },
        });
        stripeId = stripeResult.priceId;
        tracker.newVariantStripePriceIds.push(stripeResult.priceId);
      }

      return {
        id: variant.id,
        stripeId,
        color: variant.color,
        sizes: variant.sizes,
        images,
      };
    }),
  );
}

export async function POST(request: NextRequest) {
  let createdProductId: number | null = null;
  const tracker: BuildVariantsTracker = {
    uploadedImageUrls: [],
    newVariantStripePriceIds: [],
    replacementStripePriceIds: [],
    previousStripePriceIdsToDeactivate: [],
  };

  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const productData = productFormSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      category: formData.get("category"),
    });
    const variantsData = parseVariantsData(formData.get("variants"));
    const mainImageEntry = formData.get("mainImage");

    if (!(mainImageEntry instanceof File) || mainImageEntry.size === 0) {
      return NextResponse.json(
        { error: "Main image is required" },
        { status: 400 },
      );
    }

    const product = await productsRepository.create({
      ...productData,
      img: "",
    });

    if (!product) {
      return NextResponse.json(
        { error: "Error creating product" },
        { status: 500 },
      );
    }

    createdProductId = product.id;

    const mainImageUrl = await uploadImage(mainImageEntry, `products/${product.id}`);
    if (!mainImageUrl) {
      return NextResponse.json(
        { error: "Error uploading main image" },
        { status: 500 },
      );
    }

    const variants = await buildVariants({
      formData,
      variantsData,
      productId: product.id,
      productName: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      tracker,
    });

    const productWithVariants = await productsRepository.updateWithVariants(
      product.id,
      {
        ...productData,
        img: mainImageUrl,
      },
      variants,
    );

    if (!productWithVariants) {
      return NextResponse.json(
        { error: "Error creating product with variants" },
        { status: 500 },
      );
    }

    createdProductId = null;
    await safeRevalidateProducts(product.id);

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: productWithVariants,
    });
  } catch (error) {
    if (createdProductId) {
      await cleanupProductImages(createdProductId);
      await productsRepository.delete(createdProductId);
    }

    await cleanupExternalResources({
      archivePriceIds: tracker.newVariantStripePriceIds,
      deactivatePriceIds: tracker.replacementStripePriceIds,
    });

    if (error instanceof z.ZodError) {
      return validationErrorResponse(error, "Invalid product payload");
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const tracker: BuildVariantsTracker = {
    uploadedImageUrls: [],
    newVariantStripePriceIds: [],
    replacementStripePriceIds: [],
    previousStripePriceIdsToDeactivate: [],
  };

  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = productIdSchema.parse(formData.get("id"));
    const productData = productFormSchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      category: formData.get("category"),
    });
    const variantsData = parseVariantsData(formData.get("variants"));
    const mainImageEntry = formData.get("mainImage");
    const existingMainImageEntry = formData.get("existingMainImage");
    const existingMainImage =
      typeof existingMainImageEntry === "string" && existingMainImageEntry
        ? existingMainImageEntry
        : null;

    const existingProduct = await productsRepository.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const nextVariantIds = new Set(
      variantsData.flatMap((variant) => (variant.id ? [variant.id] : [])),
    );
    const removedVariants = existingProduct.variants.filter(
      (variant) => !nextVariantIds.has(variant.id),
    );
    const removedVariantStripeIds = removedVariants.map((variant) => variant.stripeId);
    const removedImageUrls = dedupeStrings([
      ...removedVariants.flatMap((variant) => variant.images),
      ...variantsData.flatMap((variant) => variant.removedImages ?? []),
    ]);

    let mainImageUrl = existingMainImage ?? existingProduct.img;
    let previousMainImageUrl: string | null = null;

    if (mainImageEntry instanceof File && mainImageEntry.size > 0) {
      const uploadedUrl = await uploadImage(mainImageEntry, `products/${id}`);
      if (!uploadedUrl) {
        return NextResponse.json(
          { error: "Error uploading main image" },
          { status: 500 },
        );
      }

      tracker.uploadedImageUrls.push(uploadedUrl);
      previousMainImageUrl = existingProduct.img || null;
      mainImageUrl = uploadedUrl;
    }

    const variants = await buildVariants({
      formData,
      variantsData,
      productId: id,
      productName: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      tracker,
    });

    const updatedProduct = await productsRepository.updateWithVariants(
      id,
      {
        ...productData,
        img: mainImageUrl,
      },
      variants,
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Error updating product" },
        { status: 500 },
      );
    }

    await safeRevalidateProducts(id);
    await cleanupExternalResources({
      imageUrls: [
        ...removedImageUrls,
        ...(previousMainImageUrl ? [previousMainImageUrl] : []),
      ],
      archivePriceIds: removedVariantStripeIds,
      deactivatePriceIds: tracker.previousStripePriceIdsToDeactivate,
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    await cleanupExternalResources({
      imageUrls: tracker.uploadedImageUrls,
      archivePriceIds: tracker.newVariantStripePriceIds,
      deactivatePriceIds: tracker.replacementStripePriceIds,
    });

    if (error instanceof z.ZodError) {
      return validationErrorResponse(error, "Invalid product payload");
    }

    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = productIdSchema.parse(request.nextUrl.searchParams.get("id"));
    const existingProduct = await productsRepository.findById(productId);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const deleted = await productsRepository.delete(productId);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await safeRevalidateProducts(productId);
    await cleanupProductImages(productId);
    await cleanupExternalResources({
      archivePriceIds: existingProduct.variants.map((variant) => variant.stripeId),
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error, "Invalid product id");
    }

    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
