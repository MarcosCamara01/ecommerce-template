import { z } from "zod";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  bigserial,
  text,
  bigint,
  integer,
  timestamp,
  unique,
  index,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";

import { appPrivate } from "./namespace";
import { users } from "./users";
import {
  productsVariants,
  selectProductSchema,
  selectVariantSchema,
  sizesEnum,
  ProductSizeZod,
} from "./products";

export const cartItems = appPrivate.table(
  "cart_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    variantId: bigint("variant_id", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    size: sizesEnum("size").notNull(),
    stripeId: text("stripe_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("cart_user_variant_size_unique").on(
      table.userId,
      table.variantId,
      table.size,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "cart_items_user_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productsVariants.id],
      name: "cart_items_variant_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    index("idx_cart_user_id").on(table.userId),
    index("idx_cart_variant_id").on(table.variantId),
    index("idx_cart_updated_at").on(table.updatedAt),
    index("idx_cart_user_variant_size").on(
      table.userId,
      table.variantId,
      table.size,
    ),
    check("quantity_positive", sql`quantity > 0`),
  ],
);

export const selectCartItemSchema = createSelectSchema(cartItems, {
  size: ProductSizeZod,
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertCartItemSchema = createInsertSchema(cartItems, {
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  stripeId: z.string().min(1, "Stripe ID is required"),
  size: ProductSizeZod,
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateCartItemSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export const addToCartSchema = insertCartItemSchema.omit({
  userId: true,
  stripeId: true,
});

export const minimalCartItemSchema = z.object({
  variantId: z.number(),
  size: ProductSizeZod,
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  stripeId: z.string().min(1, "Stripe ID is required"),
});

export const cartItemWithDetailsSchema = selectCartItemSchema.extend({
  variant: selectVariantSchema,
  product: selectProductSchema,
});

export type CartItem = z.infer<typeof selectCartItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type UpdateCartItem = z.infer<typeof updateCartItemSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type MinimalCartItem = z.infer<typeof minimalCartItemSchema>;
export type CartItemWithDetails = z.infer<typeof cartItemWithDetailsSchema>;
