import { z } from "zod";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  pgTable,
  bigserial,
  text,
  bigint,
  timestamp,
  unique,
  index,
  pgPolicy,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { productsItems } from "./products";

export const wishlist = pgTable(
  "wishlist",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    productId: bigint("product_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("wishlist_user_product_unique").on(table.userId, table.productId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "wishlist_user_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [productsItems.id],
      name: "wishlist_product_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    index("idx_wishlist_user_id").on(table.userId),
    index("idx_wishlist_product_id").on(table.productId),
    index("idx_wishlist_updated_at").on(table.updatedAt),
    index("idx_wishlist_user_product").on(table.userId, table.productId),
    pgPolicy("Users can view own wishlist items", {
      as: "permissive",
      for: "select",
      to: "public",
      using: sql`app.current_user_id() = user_id`,
    }),
    pgPolicy("Users can insert own wishlist items", {
      as: "permissive",
      for: "insert",
      to: "public",
      withCheck: sql`app.current_user_id() = user_id`,
    }),
    pgPolicy("Users can delete own wishlist items", {
      as: "permissive",
      for: "delete",
      to: "public",
      using: sql`app.current_user_id() = user_id`,
    }),
  ]
);

// Zod Schemas
export const selectWishlistItemSchema = createSelectSchema(wishlist, {
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const addToWishlistSchema = insertWishlistItemSchema.omit({ userId: true });

// Types
export type WishlistItem = z.infer<typeof selectWishlistItemSchema>;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
