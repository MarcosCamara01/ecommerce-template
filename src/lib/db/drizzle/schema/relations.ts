import { relations } from "drizzle-orm";
import { users } from "./users";
import { productsItems, productsVariants } from "./products";
import { cartItems } from "./cart";
import { orderItems, customerInfo, orderProducts } from "./orders";
import { wishlist } from "./wishlist";

export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
  orders: many(orderItems),
  wishlist: many(wishlist),
}));

export const productsItemsRelations = relations(productsItems, ({ many }) => ({
  variants: many(productsVariants),
  wishlistItems: many(wishlist),
}));

export const productsVariantsRelations = relations(
  productsVariants,
  ({ one, many }) => ({
    product: one(productsItems, {
      fields: [productsVariants.productId],
      references: [productsItems.id],
    }),
    cartItems: many(cartItems),
    orderProducts: many(orderProducts),
  })
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  variant: one(productsVariants, {
    fields: [cartItems.variantId],
    references: [productsVariants.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  user: one(users, {
    fields: [orderItems.userId],
    references: [users.id],
  }),
  customerInfo: one(customerInfo, {
    fields: [orderItems.id],
    references: [customerInfo.orderId],
  }),
  orderProducts: many(orderProducts),
}));

export const customerInfoRelations = relations(customerInfo, ({ one }) => ({
  order: one(orderItems, {
    fields: [customerInfo.orderId],
    references: [orderItems.id],
  }),
}));

export const orderProductsRelations = relations(orderProducts, ({ one }) => ({
  order: one(orderItems, {
    fields: [orderProducts.orderId],
    references: [orderItems.id],
  }),
  variant: one(productsVariants, {
    fields: [orderProducts.variantId],
    references: [productsVariants.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  product: one(productsItems, {
    fields: [wishlist.productId],
    references: [productsItems.id],
  }),
}));
