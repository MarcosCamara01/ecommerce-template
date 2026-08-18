import { z } from "zod";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
  bigserial,
  text,
  bigint,
  integer,
  timestamp,
  jsonb,
  index,
  check,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

import { appPrivate } from "./namespace";
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
  line2: z.string().nullable().optional().transform((value) => value ?? undefined),
  city: z.string().min(1, "City is required"),
  state: z.string().nullable().optional().transform((value) => value ?? undefined),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export type Address = z.infer<typeof AddressSchema>;

export const orderItems = appPrivate.table(
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
    }).onDelete("restrict").onUpdate("cascade"),
    index("idx_order_items_user_id").on(table.userId),
    index("idx_order_items_order_number").on(table.orderNumber),
    index("idx_order_items_created_at").on(table.createdAt),
    index("idx_order_items_delivery_date").on(table.deliveryDate),
    index("idx_order_items_user_created").on(table.userId, table.createdAt),
  ],
);

export const customerInfo = appPrivate.table(
  "customer_info",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    address: jsonb("address").notNull().$type<Address>(),
    stripeOrderId: text("stripe_order_id").notNull().unique(),
    totalPrice: bigint("total_price", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("eur"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orderItems.id],
      name: "customer_info_order_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    index("idx_customer_info_order_id").on(table.orderId),
    index("idx_customer_info_stripe_order_id").on(table.stripeOrderId),
    index("idx_customer_info_email").on(table.email),
  ],
);

export const orderProducts = appPrivate.table(
  "order_products",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).notNull(),
    variantId: bigint("variant_id", { mode: "number" }).notNull(),
    quantity: integer("quantity").notNull(),
    size: text("size").notNull(),
    unitAmount: bigint("unit_amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orderItems.id],
      name: "order_products_order_id_fkey",
    }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({
      columns: [table.variantId],
      foreignColumns: [productsVariants.id],
      name: "order_products_variant_id_fkey",
    }).onDelete("restrict").onUpdate("cascade"),
    index("idx_order_products_order_id").on(table.orderId),
    index("idx_order_products_variant_id").on(table.variantId),
    check("order_quantity_positive", sql`quantity > 0`),
    check("order_unit_amount_nonnegative", sql`unit_amount >= 0`),
  ],
);

export const historicalOrderPriceEvidence = appPrivate.table(
  "historical_order_price_evidence",
  {
    orderProductId: bigint("order_product_id", { mode: "number" })
      .primaryKey(),
    stripeSessionId: text("stripe_session_id").notNull(),
    stripeLineItemId: text("stripe_line_item_id").notNull(),
    unitAmount: bigint("unit_amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.orderProductId],
      foreignColumns: [orderProducts.id],
      name: "historical_price_evidence_order_product_fk",
    }).onDelete("restrict"),
    unique("historical_price_stripe_line_item_unique").on(
      table.stripeLineItemId,
    ),
    check(
      "historical_price_unit_amount_nonnegative",
      sql`${table.unitAmount} >= 0`,
    ),
    check(
      "historical_price_currency_length",
      sql`char_length(${table.currency}) = 3`,
    ),
  ],
);

export const selectOrderItemSchema = createSelectSchema(orderItems, {
  deliveryDate: z.coerce.string(),
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  deliveryDate: z.coerce.date(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const createOrderItemInputSchema = insertOrderItemSchema.pick({
  userId: true,
  deliveryDate: true,
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
  currency: z.string().length(3),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const selectOrderProductSchema = createSelectSchema(orderProducts, {
  size: ProductSizeZod,
  createdAt: z.coerce.string(),
  updatedAt: z.coerce.string(),
});

export const insertOrderProductSchema = createInsertSchema(orderProducts, {
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitAmount: z.number().int().nonnegative(),
  currency: z.string().length(3),
}).omit({ id: true, createdAt: true, updatedAt: true });

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

export type OrderItem = z.infer<typeof selectOrderItemSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;
export type CustomerInfo = z.infer<typeof selectCustomerInfoSchema>;
export type InsertCustomerInfo = z.infer<typeof insertCustomerInfoSchema>;
export type OrderProduct = z.infer<typeof selectOrderProductSchema>;
export type InsertOrderProduct = z.infer<typeof insertOrderProductSchema>;
export type OrderProductWithDetails = z.infer<typeof orderProductWithDetailsSchema>;
export type OrderWithDetails = z.infer<typeof orderWithDetailsSchema>;
