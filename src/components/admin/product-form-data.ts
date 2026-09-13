import type { ProductCategory } from "@/lib/db/drizzle/schema";
import type { VariantSubmitData } from "@/types/admin";

export function encodeProductFormData(input: {
  mode: "create" | "edit";
  productId?: number;
  restoreArchived?: boolean;
  commandId?: string;
  basicInfo: {
    name: string;
    description: string;
    price: string;
    category: ProductCategory | "";
  };
  mainImage: File | null;
  existingMainImage: string | null;
  variants: VariantSubmitData[];
  images: Record<string, File[]>;
}) {
  if (input.mode === "create" && !input.commandId) {
    throw new Error("Create product command id is required");
  }
  if (input.mode === "edit" && !input.productId) {
    throw new Error("Edit product id is required");
  }

  const form = new FormData();
  if (input.productId) form.append("id", String(input.productId));
  if (input.restoreArchived) form.append("restoreArchived", "true");
  if (input.commandId) form.append("commandId", input.commandId);
  for (const [key, value] of Object.entries(input.basicInfo)) {
    form.append(key, value);
  }
  if (input.mainImage) {
    form.append("mainImage", input.mainImage);
  } else if (input.existingMainImage) {
    form.append("existingMainImage", input.existingMainImage);
  }
  input.variants.forEach((_, index) => {
    (input.images[`variant_${index}`] || []).forEach((image, imageIndex) => {
      form.append(`variant_${index}_image_${imageIndex}`, image);
    });
  });
  form.append("variants", JSON.stringify(input.variants));
  return form;
}
