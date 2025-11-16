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

export const OrderProductSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  variant_id: z.number(),
  quantity: z.number(),
  size: ProductSizeEnum,
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const CustomerInfoSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    postal_code: z.string(),
    country: z.string(),
  }),
  stripe_order_id: z.string(),
  total_price: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const OrderItemSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  delivery_date: z.string(),
  order_number: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const CartItemSchema = z.object({
  id: z.number(),
  variant_id: z.number(),
  quantity: z.number(),
  size: ProductSizeEnum,
  stripe_id: z.string(),
  user_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const WishlistItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  user_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
});

export const ProductWithVariantsSchema = z.object({
  ...ProductSchema.shape,
  variants: ProductVariantSchema.array(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductWithVariants = z.infer<typeof ProductWithVariantsSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderProduct = z.infer<typeof OrderProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type WishlistItem = z.infer<typeof WishlistItemSchema>;
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;
export type ProductSize = z.infer<typeof ProductSizeEnum>;

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

export const ProductVariantWithProductSchema = ProductVariantSchema.extend({
  products_items: ProductSchema,
});

export const OrderProductWithDetailsSchema = OrderProductSchema.extend({
  products_variants: ProductVariantWithProductSchema,
});

export const OrderWithDetailsSchema = OrderItemSchema.extend({
  order_products: z.array(OrderProductWithDetailsSchema),
  customer_info: CustomerInfoSchema,
});

export type ProductVariantWithProduct = z.infer<
  typeof ProductVariantWithProductSchema
>;
export type OrderProductWithDetails = z.infer<
  typeof OrderProductWithDetailsSchema
>;
export type OrderWithDetails = z.infer<typeof OrderWithDetailsSchema>;

export const productsWithVariantsQuery = "*, variants:products_variants(*)";
