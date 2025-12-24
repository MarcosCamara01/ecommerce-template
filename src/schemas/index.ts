// ============================================
// SCHEMA EXPORTS
// Re-exports all schemas from unified Drizzle + Zod files
// ============================================

// Auth schemas (local)
export * from "./auth";

// All other schemas from Drizzle unified files
export {
  // ========== ENUMS ==========
  productCategoryEnum,
  sizesEnum,
  ProductCategoryZod,
  ProductSizeZod,

  // ========== PRODUCTS ==========
  // Tables
  productsItems,
  productsVariants,
  // Relations
  productsItemsRelations,
  productsVariantsRelations,
  // Zod Schemas
  selectProductSchema as ProductSchema,
  insertProductSchema as InsertProductSchema,
  updateProductSchema as UpdateProductSchema,
  selectVariantSchema as ProductVariantSchema,
  insertVariantSchema as InsertProductVariantSchema,
  productWithVariantsSchema as ProductWithVariantsSchema,
  variantWithProductSchema as ProductVariantWithProductSchema,
  createProductWithVariantsSchema as CreateProductWithVariantsInput,
  // Types
  type Product,
  type InsertProduct,
  type UpdateProduct,
  type ProductVariant,
  type InsertProductVariant,
  type ProductWithVariants,
  type VariantWithProduct,
  type CreateProductWithVariants,
  type ProductCategory,
  type ProductSize,

  // ========== CART ==========
  // Table
  cartItems,
  // Relations
  cartItemsRelations,
  // Zod Schemas
  selectCartItemSchema as CartItemSchema,
  insertCartItemSchema as InsertCartItemSchema,
  updateCartItemSchema as UpdateCartItemSchema,
  addToCartSchema,
  // Types
  type CartItem,
  type InsertCartItem,
  type UpdateCartItem,
  type AddToCartInput,

  // ========== ORDERS ==========
  // Tables
  orderItems,
  customerInfo,
  orderProducts,
  // Relations
  orderItemsRelations,
  customerInfoRelations,
  orderProductsRelations,
  // Zod Schemas
  AddressSchema,
  selectOrderItemSchema as OrderItemSchema,
  insertOrderItemSchema as InsertOrderItemSchema,
  selectCustomerInfoSchema as CustomerInfoSchema,
  insertCustomerInfoSchema as InsertCustomerInfoSchema,
  selectOrderProductSchema as OrderProductSchema,
  insertOrderProductSchema as InsertOrderProductSchema,
  orderProductWithDetailsSchema as OrderProductWithDetailsSchema,
  orderWithDetailsSchema as OrderWithDetailsSchema,
  // Types
  type Address,
  type OrderItem,
  type InsertOrderItem,
  type CustomerInfo,
  type InsertCustomerInfo,
  type OrderProduct,
  type InsertOrderProduct,
  type OrderProductWithDetails,
  type OrderWithDetails,

  // ========== WISHLIST ==========
  // Table
  wishlist,
  // Relations
  wishlistRelations,
  // Zod Schemas
  selectWishlistItemSchema as WishlistItemSchema,
  insertWishlistItemSchema as InsertWishlistItemSchema,
  addToWishlistSchema,
  // Types
  type WishlistItem,
  type InsertWishlistItem,
  type AddToWishlistInput,

  // ========== USERS ==========
  // Table
  users,
  // Relations
  usersRelations,
  // Zod Schemas
  selectUserSchema,
  insertUserSchema,
  updateUserSchema,
  // Types
  type SelectUser,
  type InsertUser,
  type UpdateUser,
} from "@/lib/db/drizzle/schema";

// Re-export ProductSizeZod as ProductSizeEnum for backward compatibility
export { ProductSizeZod as ProductSizeEnum } from "@/lib/db/drizzle/schema";
