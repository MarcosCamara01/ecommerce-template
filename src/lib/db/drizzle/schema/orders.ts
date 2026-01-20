import { z } from "zod";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  pgTable,
  bigserial,
  text,
  bigint,
  integer,
  timestamp,
  jsonb,
  index,
  check,
  pgPolicy,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import {
  productsVariants,
  ProductSizeZod,
  selectProductSchema,
  selectVariantSchema,
} from "./products";

export const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().nullable().optional(),
  city: z.string(),
  state: z.string().nullable().optional(),
  postal_code: z.string(),
  country: z.string(),
});

export const InsertAddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  city: z.string().min(1, "City is required"),
  state: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type Address = z.infer<typeof AddressSchema>;

export const orderItems = pgTable(
  "order_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }).notNull(),
    orderNumber: bigint("order_number", { mode: "number" }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "order_items_user_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("idx_order_items_user_id").on(table.userId),
    index("idx_order_items_order_number").on(table.orderNumber),
    index("idx_order_items_created_at").on(table.createdAt),
    index("idx_order_items_delivery_date").on(table.deliveryDate),
    index("idx_order_items_user_created").on(table.userId, table.createdAt),
    pgPolicy("Allow all order operations", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
);

export const customerInfo = pgTable(
  "customer_info",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    address: jsonb("address").notNull().$type<Address>(),
    stripeOrderId: text("stripe_order_id").notNull(),
    totalPrice: bigint("total_price", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orderItems.id],
      name: "customer_info_order_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    index("idx_customer_info_order_id").on(table.orderId),
    index("idx_customer_info_stripe_order_id").on(table.stripeOrderId),
    index("idx_customer_info_email").on(table.email),
    pgPolicy("Allow all customer info operations", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
);

export const orderProducts = pgTable(
  "order_products",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).notNull(),
    variantId: bigint("variant_id", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    size: text("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orderItems.id],
      name: "order_products_order_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productsVariants.id],
      name: "order_products_variant_id_fkey",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    index("idx_order_products_order_id").on(table.orderId),
    index("idx_order_products_variant_id").on(table.variantId),
    check("order_quantity_positive", sql`quantity > 0`),
    pgPolicy("Allow all order products operations", {
      as: "permissive",
      for: "all",
      to: "public",
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
);

// Zod Schemas
export const selectOrderItemSchema = createSelectSchema(orderItems, {
  deliveryDate: z.coerce.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  deliveryDate: z.coerce.date(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCustomerInfoSchema = createSelectSchema(customerInfo, {
  address: AddressSchema,
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertCustomerInfoSchema = createInsertSchema(customerInfo, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  address: InsertAddressSchema,
  totalPrice: z.number().int().positive("Total price must be greater than 0"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectOrderProductSchema = createSelectSchema(orderProducts, {
  size: ProductSizeZod,
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertOrderProductSchema = createInsertSchema(orderProducts, {
  quantity: z.number().int().positive("Quantity must be greater than 0"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const variantWithProductSchema = selectVariantSchema.extend({
  product: selectProductSchema,
});

export const orderProductWithDetailsSchema = selectOrderProductSchema.extend({
  variant: variantWithProductSchema,
});

export const orderWithDetailsSchema = selectOrderItemSchema.extend({
  orderProducts: z.array(orderProductWithDetailsSchema),
  customerInfo: selectCustomerInfoSchema,
});

// Types
export type OrderItem = z.infer<typeof selectOrderItemSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CustomerInfo = z.infer<typeof selectCustomerInfoSchema>;
export type InsertCustomerInfo = z.infer<typeof insertCustomerInfoSchema>;
export type OrderProduct = z.infer<typeof selectOrderProductSchema>;
export type InsertOrderProduct = z.infer<typeof insertOrderProductSchema>;
export type OrderProductWithDetails = z.infer<
  typeof orderProductWithDetailsSchema
>;
export type OrderWithDetails = z.infer<typeof orderWithDetailsSchema>;
