import type { Product, ProductVariant, ProductWithVariants } from "@/schemas";

// Derived from Product schema
export type BasicInfoData = Pick<Product, "name" | "description" | "price" | "category">;

// Derived from ProductVariant - form state representation
export type VariantFormData = Pick<ProductVariant, "color" | "stripeId" | "sizes" | "images"> & {
  id?: ProductVariant["id"];
};

// Variant data for form submission (snake_case for API, includes UI state)
export interface VariantSubmitData {
  id?: ProductVariant["id"];
  color: ProductVariant["color"];
  stripe_id: ProductVariant["stripeId"];
  sizes: ProductVariant["sizes"];
  imageCount: number;
  existingImages: string[];
  removedImages: string[];
}

export interface ProductFormData {
  id?: Product["id"];
  basicInfo: BasicInfoData;
  mainImageUrl?: Product["img"];
  variants: VariantFormData[];
}

export interface ProductApiResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: ProductWithVariants;
}

// Alias for clarity in API routes
export type VariantApiData = VariantSubmitData;
