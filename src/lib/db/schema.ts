import {
  bigserial,
  bigint,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const productCategoryEnum = pgEnum("product_category", [
  "t-shirts",
  "pants",
  "sweatshirt",
]);

export const sizeEnum = pgEnum("sizes", ["XS", "S", "M", "L", "XL", "XXL"]);

export const productsItems = pgTable(
  "products_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 })
      .$type<number>()
      .notNull(),
    category: productCategoryEnum("category").notNull(),
    img: varchar("img", { length: 500 }).notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    categoryIdx: index("idx_products_category").on(table.category),
    nameIdx: index("idx_products_name").on(table.name),
    createdIdx: index("idx_products_created_at").on(table.created_at),
    updatedIdx: index("idx_products_updated_at").on(table.updated_at),
  })
);

export const productsVariants = pgTable(
  "products_variants",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    product_id: bigint("product_id", { mode: "number" })
      .references(() => productsItems.id, { onDelete: "cascade" })
      .notNull(),
    stripe_id: varchar("stripe_id", { length: 255 }).notNull(),
    color: varchar("color", { length: 100 }).notNull(),
    sizes: sizeEnum("sizes").array().notNull(),
    images: text("images").array().notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productIdx: index("idx_variants_product_id").on(table.product_id),
    stripeIdx: index("idx_variants_stripe_id").on(table.stripe_id),
    colorIdx: index("idx_variants_color").on(table.color),
    createdIdx: index("idx_variants_created_at").on(table.created_at),
    updatedIdx: index("idx_variants_updated_at").on(table.updated_at),
    uniqueProductColor: uniqueIndex(
      "products_variants_product_id_color_key"
    ).on(table.product_id, table.color),
    stripeUnique: uniqueIndex("products_variants_stripe_id_key").on(
      table.stripe_id
    ),
  })
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_id: text("user_id").notNull(),
    variant_id: bigint("variant_id", { mode: "number" })
      .references(() => productsVariants.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    size: sizeEnum("size").notNull(),
    stripe_id: text("stripe_id").notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("idx_cart_user_id").on(table.user_id),
    variantIdx: index("idx_cart_variant_id").on(table.variant_id),
    updatedIdx: index("idx_cart_updated_at").on(table.updated_at),
    userVariantSize: uniqueIndex(
      "cart_items_user_id_variant_id_size_key"
    ).on(table.user_id, table.variant_id, table.size),
  })
);

export const wishlist = pgTable(
  "wishlist",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_id: text("user_id").notNull(),
    product_id: bigint("product_id", { mode: "number" })
      .references(() => productsItems.id, { onDelete: "cascade" })
      .notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("idx_wishlist_user_id").on(table.user_id),
    productIdx: index("idx_wishlist_product_id").on(table.product_id),
    updatedIdx: index("idx_wishlist_updated_at").on(table.updated_at),
    userProductUnique: uniqueIndex("wishlist_user_id_product_id_key").on(
      table.user_id,
      table.product_id
    ),
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_id: text("user_id").notNull(),
    delivery_date: timestamp("delivery_date", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    order_number: bigint("order_number", { mode: "number" }).notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("idx_order_items_user_id").on(table.user_id),
    orderNumberIdx: index("idx_order_items_order_number").on(
      table.order_number
    ),
    createdIdx: index("idx_order_items_created_at").on(table.created_at),
    deliveryIdx: index("idx_order_items_delivery_date").on(
      table.delivery_date
    ),
    userCreatedIdx: index("idx_order_items_user_created").on(
      table.user_id,
      table.created_at
    ),
    orderNumberUnique: uniqueIndex("order_items_order_number_key").on(
      table.order_number
    ),
  })
);

export type CustomerAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export const customerInfo = pgTable(
  "customer_info",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    order_id: bigint("order_id", { mode: "number" })
      .references(() => orderItems.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    address: jsonb("address").$type<CustomerAddress>().notNull(),
    stripe_order_id: text("stripe_order_id").notNull(),
    total_price: bigint("total_price", { mode: "number" }).notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderIdx: index("idx_customer_info_order_id").on(table.order_id),
    stripeIdx: index("idx_customer_info_stripe_order_id").on(
      table.stripe_order_id
    ),
    emailIdx: index("idx_customer_info_email").on(table.email),
    orderUnique: uniqueIndex("customer_info_order_id_key").on(table.order_id),
  })
);

export const orderProducts = pgTable(
  "order_products",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    order_id: bigint("order_id", { mode: "number" })
      .references(() => orderItems.id, { onDelete: "cascade" })
      .notNull(),
    variant_id: bigint("variant_id", { mode: "number" })
      .references(() => productsVariants.id, { onDelete: "restrict" })
      .notNull(),
    quantity: integer("quantity").notNull(),
    size: text("size").notNull(),
    created_at: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    orderIdx: index("idx_order_products_order_id").on(table.order_id),
    variantIdx: index("idx_order_products_variant_id").on(table.variant_id),
  })
);

export const productsItemsRelations = relations(
  productsItems,
  ({ many }) => ({
    variants: many(productsVariants),
    wishlist: many(wishlist),
  })
);

export const productsVariantsRelations = relations(
  productsVariants,
  ({ one, many }) => ({
    products_items: one(productsItems, {
      fields: [productsVariants.product_id],
      references: [productsItems.id],
    }),
    order_products: many(orderProducts),
    cart_items: many(cartItems),
  })
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  products_variants: one(productsVariants, {
    fields: [cartItems.variant_id],
    references: [productsVariants.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  products_items: one(productsItems, {
    fields: [wishlist.product_id],
    references: [productsItems.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ many, one }) => ({
  order_products: many(orderProducts),
  customer_info: one(customerInfo, {
    fields: [orderItems.id],
    references: [customerInfo.order_id],
  }),
}));

export const orderProductsRelations = relations(orderProducts, ({ one }) => ({
  order_items: one(orderItems, {
    fields: [orderProducts.order_id],
    references: [orderItems.id],
  }),
  products_variants: one(productsVariants, {
    fields: [orderProducts.variant_id],
    references: [productsVariants.id],
  }),
}));

export const customerInfoRelations = relations(customerInfo, ({ one }) => ({
  order_items: one(orderItems, {
    fields: [customerInfo.order_id],
    references: [orderItems.id],
  }),
}));

export type ProductItem = InferSelectModel<typeof productsItems>;
export type ProductVariant = InferSelectModel<typeof productsVariants>;
export type CartItemRow = InferSelectModel<typeof cartItems>;
export type NewCartItemRow = InferInsertModel<typeof cartItems>;
export type WishlistItemRow = InferSelectModel<typeof wishlist>;
export type OrderItemRow = InferSelectModel<typeof orderItems>;
export type OrderProductRow = InferSelectModel<typeof orderProducts>;
export type CustomerInfoRow = InferSelectModel<typeof customerInfo>;

