import { z } from "zod";

export const ProductCategoryEnum = z.enum(["t-shirts", "pants", "sweatshirt"]);
export const ProductSizeEnum = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: ProductCategoryEnum,
  img: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const ProductVariantSchema = z.object({
  id: z.number(),
  stripe_id: z.string(),
  product_id: z.number(),
  color: z.string(),
  sizes: z.array(ProductSizeEnum),
  images: z.array(z.string()),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const ProductWithVariantsSchema = z.object({
  ...ProductSchema.shape,
  variants: ProductVariantSchema.array(),
});

export const ProductVariantWithProductSchema = ProductVariantSchema.extend({
  products_items: ProductSchema,
});

export const CreateProductVariantInput = ProductVariantSchema.omit({
  id: true,
  product_id: true,
  created_at: true,
  updated_at: true,
});

export const CreateProductWithVariantsInput = ProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  variants: z.array(CreateProductVariantInput),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductWithVariants = z.infer<typeof ProductWithVariantsSchema>;
export type ProductVariantWithProduct = z.infer<typeof ProductVariantWithProductSchema>;
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;
export type ProductSize = z.infer<typeof ProductSizeEnum>;

export const productsWithVariantsQuery = "*, variants:products_variants(*)";

