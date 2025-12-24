// Database types - Re-exported from schemas for backwards compatibility
// All types are now derived from Drizzle schemas via drizzle-zod

export type {
  OrderItem,
  CustomerInfo,
  OrderProduct,
  Address,
  CartItem,
  WishlistItem,
  Product,
  ProductVariant,
  ProductWithVariants,
  ProductCategory,
  ProductSize,
} from "@/schemas";
