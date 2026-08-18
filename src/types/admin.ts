import type {
  Product,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";

// Derived from Product schema
export type BasicInfoData = Pick<
  Product,
  "name" | "description" | "price" | "category"
>;

// Derived from ProductVariant - form state representation
export type VariantFormData = Pick<
  ProductVariant,
  "color" | "sizes" | "images"
> & {
  id?: ProductVariant["id"];
};

// Variant data for form submission, including UI image state.
export interface VariantSubmitData {
  id?: ProductVariant["id"];
  color: ProductVariant["color"];
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
  accepted?: boolean;
  operationId?: string;
  syncState?: string;
  retryable?: boolean;
}

// Alias for clarity in API routes
export type VariantApiData = VariantSubmitData;
