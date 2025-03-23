import { z } from "zod";

enum ProductCategory {
  T_SHIRT = "t-shirt",
  PANTS = "pants",
  SWEATSHIRT = "sweatshirt",
}

enum ProductSize {
  XS = "xs",
  S = "s",
  M = "m",
  L = "l",
  XL = "xl",
  XXL = "2xl",
}

export const ProductsItems = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.nativeEnum(ProductCategory),
  img: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const ProductsVariants = z.object({
  id: z.number(),
  stripe_id: z.string(),
  product_id: z.number(),
  color: z.string(),
  sizes: z.array(z.nativeEnum(ProductSize)),
  images: z.array(z.string()),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const OrderItems = z.object({
  id: z.number(),
  user_id: z.string(),
  delivery_date: z.string(),
  order_number: z.number(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const OrderProduct = z.object({
  id: z.number(),
  order_id: z.number(),
  variant_id: z.number(),
  quantity: z.number(),
  size: z.nativeEnum(ProductSize),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const CartItems = z.object({
  id: z.number(),
  variant_id: z.number(),
  quantity: z.number(),
  size: z.nativeEnum(ProductSize),
  user_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().default(() => new Date().toISOString()),
});

export const Wishlist = z.object({
  id: z.number(),
  variant_id: z.number(),
  user_id: z.string(),
  created_at: z.string().default(() => new Date().toISOString()),
});

export type Product = z.infer<typeof ProductsItems>;
export type ProductVariant = z.infer<typeof ProductsVariants>;
export type OrderItem = z.infer<typeof OrderItems>;
export type OrderProduct = z.infer<typeof OrderProduct>;
export type CartItem = z.infer<typeof CartItems>;
export type WishlistItem = z.infer<typeof Wishlist>;
export type EnrichedProduct = Product & {
  variants: ProductVariant[];
};

export const productsWithVariantsQuery = '*, variants:products_variants(*)';
