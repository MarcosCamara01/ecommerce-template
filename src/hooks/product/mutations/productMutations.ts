import {
  CreateProductWithVariantsInput,
  Product,
  ProductSchema,
  ProductVariantSchema,
  ProductWithVariants,
} from "@/schemas/ecommerce";
import { createClient } from "@/utils/supabase/client";

type CreateProductResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: ProductWithVariants;
};

const BUCKET = "product-images";

const uploadImage = async (file: File, path: string) => {
  const supabase = createClient();

  const ext = file.name.split(".").pop();
  const name = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${ext}`;
  const fullPath = `${path}/${name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, file, { cacheControl: "3600", upsert: false });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  return publicUrl;
};

const cleanupProduct = async (productId: Product["id"]) => {
  const supabase = createClient();

  await supabase.from("products_items").delete().eq("id", productId);

  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`products/${productId}`, { limit: 100 });

  if (files?.length) {
    const paths = files.map((f: any) => `products/${productId}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
};

export async function createProduct(
  formData: FormData
): Promise<CreateProductResponse> {
  const supabase = createClient();
  let productId: Product["id"] | null = null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "User not authenticated" };

    console.log(formData.get("name"));
    console.log(formData.get("description"));
    console.log(formData.get("price"));
    console.log(formData.get("category"));
    console.log(formData.get("mainImage"));
    console.log(formData.get("variants"));

    const { data: product, error: productError } = await supabase
      .from("products_items")
      .insert({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: Number(formData.get("price")),
        category: formData.get("category") as string,
        img: "",
      })
      .select()
      .single();

    if (productError)
      return { success: false, message: "Error creating product" };

    productId = ProductSchema.parse(product).id;

    const mainImageFile = formData.get("mainImage") as File;
    const mainImageUrl = await uploadImage(
      mainImageFile,
      `products/${productId}`
    );

    if (!mainImageUrl) {
      await cleanupProduct(productId);
      return { success: false, message: "Error uploading main image" };
    }

    await supabase
      .from("products_items")
      .update({ img: mainImageUrl })
      .eq("id", productId);

    const variantsData = JSON.parse(formData.get("variants") as string);

    const variants = await Promise.all(
      variantsData.map(async (v: any, idx: number) => {
        const images: string[] = [];
        const colorPath = v.color
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        for (let i = 0; i < (v.imageCount || 0); i++) {
          const file = formData.get(`variant_${idx}_image_${i}`) as File;
          if (file) {
            const url = await uploadImage(
              file,
              `products/${productId}/variants/${colorPath}`
            );
            if (url) images.push(url);
          }
        }

        return {
          color: v.color,
          stripe_id: v.stripe_id,
          sizes: v.sizes,
          images,
        };
      })
    );

    const validation = CreateProductWithVariantsInput.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      category: formData.get("category"),
      img: mainImageUrl,
      variants,
    });

    if (!validation.success) {
      await cleanupProduct(productId);
      return {
        success: false,
        message: "Validation error",
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { data: variantsResult, error: variantsError } = await supabase
      .from("products_variants")
      .insert(variants.map((v) => ({ product_id: productId, ...v })))
      .select();

    if (variantsError) {
      await cleanupProduct(productId);
      return { success: false, message: "Error creating variants" };
    }

    return {
      success: true,
      message: "Product created successfully",
      data: {
        ...product,
        img: mainImageUrl,
        variants: ProductVariantSchema.array().parse(variantsResult),
      },
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    if (productId) await cleanupProduct(productId);
    return { success: false, message: "Unexpected error creating product" };
  }
}
