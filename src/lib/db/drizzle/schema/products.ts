import { z } from "zod";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  bigserial,
  varchar,
  text,
  decimal,
  timestamp,
  bigint,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";

import { appPrivate } from "./namespace";

export const productCategoryEnum = appPrivate.enum("product_category", [
  "t-shirts",
  "pants",
  "sweatshirts",
]);

export const sizesEnum = appPrivate.enum("sizes", [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
]);

export const ProductCategoryZod = z.enum(["t-shirts", "pants", "sweatshirts"]);
export const ProductSizeZod = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);

export const productsItems = appPrivate.table(
  "products_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    category: productCategoryEnum("category").notNull(),
    img: varchar("img", { length: 500 }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_products_category").on(table.category),
    index("idx_products_name").on(table.name),
    index("idx_products_archived_at").on(table.archivedAt),
    index("idx_products_created_at").on(table.createdAt),
    index("idx_products_updated_at").on(table.updatedAt),
    check("price_positive", sql`price > 0`),
  ],
);

export const productsVariants = appPrivate.table(
  "products_variants",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => productsItems.id, { onDelete: "cascade" }),
    stripeId: varchar("stripe_id", { length: 255 }).notNull().unique(),
    color: varchar("color", { length: 100 }).notNull(),
    sizes: sizesEnum("sizes").array().notNull(),
    images: text("images").array().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("product_color_unique").on(table.productId, table.color),
    index("idx_variants_product_id").on(table.productId),
    index("idx_variants_stripe_id").on(table.stripeId),
    index("idx_variants_color").on(table.color),
    index("idx_variants_archived_at").on(table.archivedAt),
    index("idx_variants_created_at").on(table.createdAt),
    index("idx_variants_updated_at").on(table.updatedAt),
  ],
);

export const selectProductSchema = createSelectSchema(productsItems, {
  price: z.coerce.number(),
  archivedAt: z.coerce.string().nullable(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertProductSchema = createInsertSchema(productsItems, {
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  img: z.string().url("Must be a valid URL"),
}).omit({ id: true, archivedAt: true, createdAt: true, updatedAt: true });

export const updateProductSchema = selectProductSchema
  .omit({ archivedAt: true, createdAt: true })
  .partial()
  .required({ id: true });

export const selectVariantSchema = createSelectSchema(productsVariants, {
  archivedAt: z.coerce.string().nullable(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertVariantSchema = createInsertSchema(productsVariants, {
  stripeId: z.string().min(1, "Stripe ID is required"),
  color: z.string().min(1, "Color is required"),
}).omit({ id: true, archivedAt: true, createdAt: true, updatedAt: true });

export const productWithVariantsSchema = selectProductSchema.extend({
  variants: z.array(selectVariantSchema),
});

export const variantWithProductSchema = selectVariantSchema.extend({
  product: selectProductSchema,
});

export const createProductWithVariantsSchema = insertProductSchema.extend({
  variants: z.array(insertVariantSchema.omit({ productId: true })),
});

export type Product = z.infer<typeof selectProductSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductVariant = z.infer<typeof selectVariantSchema>;
export type InsertProductVariant = z.infer<typeof insertVariantSchema>;
export type ProductWithVariants = z.infer<typeof productWithVariantsSchema>;
export type VariantWithProduct = z.infer<typeof variantWithProductSchema>;
export type CreateProductWithVariants = z.infer<typeof createProductWithVariantsSchema>;
export type ProductCategory = z.infer<typeof ProductCategoryZod>;
export type ProductSize = z.infer<typeof ProductSizeZod>;
