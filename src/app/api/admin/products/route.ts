import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/auth";
import { productsRepository } from "@/lib/db/drizzle/repositories";
import { createServiceClient } from "@/lib/db/supabase/server";
import {
  createStripeProductForVariant,
  updateStripeProduct,
} from "@/services/stripe.service";
import { revalidateProducts } from "@/app/actions";
import type { ProductCategory, InsertProductVariant } from "@/schemas";
import type { VariantApiData } from "@/types/admin";

const BUCKET = "product-images";

type ProcessedVariant = Omit<InsertProductVariant, "productId"> & { id?: number };

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

async function uploadImage(file: File, path: string): Promise<string | null> {
  const supabase = createServiceClient();

  const ext = file.name.split(".").pop();
  const name = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${ext}`;
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
  const supabase = createServiceClient();

  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`products/${productId}`, { limit: 100 });

  if (files?.length) {
    const paths = files.map((f) => `products/${productId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const category = formData.get("category") as ProductCategory;
    const mainImageFile = formData.get("mainImage") as File;
    const variantsData = JSON.parse(formData.get("variants") as string) as VariantApiData[];

    if (!name || !description || !price || !category || !mainImageFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await productsRepository.create({
      name,
      description,
      price,
      category,
      img: "",
    });

    if (!product) {
      return NextResponse.json(
        { error: "Error creating product" },
        { status: 500 }
      );
    }

    const mainImageUrl = await uploadImage(
      mainImageFile,
      `products/${product.id}`
    );

    if (!mainImageUrl) {
      await productsRepository.delete(product.id);
      await cleanupProductImages(product.id);
      return NextResponse.json(
        { error: "Error uploading main image" },
        { status: 500 }
      );
    }

    await productsRepository.update(product.id, { img: mainImageUrl });

    const variants: ProcessedVariant[] = await Promise.all(
      variantsData.map(async (variant, idx) => {
        const images: string[] = [];
        const colorPath = variant.color
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        for (let i = 0; i < (variant.imageCount || 0); i++) {
          const file = formData.get(`variant_${idx}_image_${i}`) as File;
          if (file) {
            const url = await uploadImage(
              file,
              `products/${product.id}/variants/${colorPath}`
            );
            if (url) images.push(url);
          }
        }

        let stripeId = variant.stripe_id;
        if (!stripeId || stripeId.trim() === "") {
          const stripeResult = await createStripeProductForVariant({
            productName: name,
            variantColor: variant.color,
            description,
            price,
            images,
            metadata: {
              product_id: product.id.toString(),
              category,
            },
          });
          stripeId = stripeResult.priceId;
        }

        return {
          stripeId,
          color: variant.color,
          sizes: variant.sizes,
          images,
        };
      })
    );

    await productsRepository.delete(product.id);

    const productWithVariants = await productsRepository.createWithVariants(
      {
        name,
        description,
        price,
        category,
        img: mainImageUrl,
      },
      variants
    );

    if (!productWithVariants) {
      await cleanupProductImages(product.id);
      return NextResponse.json(
        { error: "Error creating product with variants" },
        { status: 500 }
      );
    }

    // Invalidate products cache after creating a new product
    await revalidateProducts();

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: productWithVariants,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const id = Number(formData.get("id"));
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const category = formData.get("category") as ProductCategory;
    const mainImageFile = formData.get("mainImage") as File | null;
    const existingMainImage = formData.get("existingMainImage") as string | null;
    const variantsData = JSON.parse(formData.get("variants") as string) as VariantApiData[];

    if (!id || !name || !description || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingProduct = await productsRepository.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    let mainImageUrl = existingMainImage || existingProduct.img;

    if (mainImageFile && mainImageFile.size > 0) {
      if (existingProduct.img) {
        await deleteImageByUrl(existingProduct.img);
      }
      
      const uploadedUrl = await uploadImage(mainImageFile, `products/${id}`);
      if (uploadedUrl) {
        mainImageUrl = uploadedUrl;
      }
    }

    for (const variant of variantsData) {
      if (variant.removedImages?.length) {
        for (const imageUrl of variant.removedImages) {
          await deleteImageByUrl(imageUrl);
        }
      }
    }

    const variants: ProcessedVariant[] = await Promise.all(
      variantsData.map(async (variant, idx) => {
        const existingImages: string[] = variant.existingImages || [];
        const newImages: string[] = [];
        const colorPath = variant.color
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        for (let i = 0; i < (variant.imageCount || 0); i++) {
          const file = formData.get(`variant_${idx}_image_${i}`) as File;
          if (file && file.size > 0) {
            const url = await uploadImage(
              file,
              `products/${id}/variants/${colorPath}`
            );
            if (url) newImages.push(url);
          }
        }

        const allImages = [...existingImages, ...newImages];
        let stripeId = variant.stripe_id;

        if (variant.id && stripeId) {
          const updatedStripe = await updateStripeProduct(stripeId, {
            productName: name,
            variantColor: variant.color,
            description,
            price,
            images: allImages,
            metadata: {
              product_id: id.toString(),
              category,
            },
          });
          if (updatedStripe) {
            stripeId = updatedStripe.priceId;
          }
        } else if (!stripeId || stripeId.trim() === "") {
          const stripeResult = await createStripeProductForVariant({
            productName: name,
            variantColor: variant.color,
            description,
            price,
            images: allImages,
            metadata: {
              product_id: id.toString(),
              category,
            },
          });
          stripeId = stripeResult.priceId;
        }

        return {
          id: variant.id,
          stripeId,
          color: variant.color,
          sizes: variant.sizes,
          images: allImages,
        };
      })
    );

    const updatedProduct = await productsRepository.updateWithVariants(
      id,
      {
        name,
        description,
        price,
        category,
        img: mainImageUrl,
      },
      variants
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { error: "Error updating product" },
        { status: 500 }
      );
    }

    // Invalidate products cache after updating a product
    await revalidateProducts(id);

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(productId, 10);

    await cleanupProductImages(id);

    const deleted = await productsRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Invalidate products cache after deleting a product
    await revalidateProducts(id);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
