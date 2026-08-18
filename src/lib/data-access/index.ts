import "server-only";

import {
  assertCapability,
  assertSystemPrincipal,
  assertUserPrincipal,
  type Principal,
  type SystemPrincipal,
} from "@/lib/identity";
import type {
  AddToCartInput,
  ProductCategory,
  ProductSize,
} from "@/lib/db/drizzle/schema";
import { cartRepository } from "@/lib/db/drizzle/repositories/cart.repository";
import { checkoutRepository } from "@/lib/db/drizzle/repositories/checkout.repository";
import { fulfillmentRepository } from "@/lib/db/drizzle/repositories/fulfillment.repository";
import {
  ordersRepository,
  type CompleteOrderInput,
} from "@/lib/db/drizzle/repositories/orders.repository";
import { productsRepository } from "@/lib/db/drizzle/repositories/products.repository";
import { wishlistRepository } from "@/lib/db/drizzle/repositories/wishlist.repository";
import { selectCheckoutCartItems } from "@/lib/cart/checkout-selection";

export class DataAccessError extends Error {
  constructor(
    readonly code: "not_found" | "invariant_failed",
    message: string,
  ) {
    super(message);
    this.name = "DataAccessError";
  }
}

export type FulfillmentOrderInput = CompleteOrderInput;

const catalog = {
  list: () => productsRepository.findAll(),
  findById: (id: number) => productsRepository.findById(id),
  findByCategory: (category: ProductCategory) =>
    productsRepository.findByCategory(category),
  search: (query: string) => productsRepository.search(query),
  random: (limit = 4) => productsRepository.findRandom(limit),
};

function forUser(value: Principal): UserDataAccess {
  const principal = assertUserPrincipal(value);
  const userId = principal.userId;

  return {
    checkout: {
      createIntent: (items) => checkoutRepository.create(userId, items),
      bindIntent: (intentId, checkoutSessionId) =>
        checkoutRepository.bind(userId, intentId, checkoutSessionId),
      ownsSession: async (intentId, checkoutSessionId) =>
        Boolean(
          await checkoutRepository.findOwned(
            userId,
            intentId,
            checkoutSessionId,
          ),
        ),
    },
    cart: {
      list: () => cartRepository.findByUserId(userId),
      listWithDetails: () => cartRepository.findByUserIdWithDetails(userId),
      find: (variantId, size) => cartRepository.findOne(userId, variantId, size),
      add: async (item) => {
        const result = await cartRepository.upsertAvailable({ ...item, userId });
        if (!result) {
          throw new DataAccessError("not_found", "Variant or size is unavailable");
        }
        return result;
      },
      update: async (id, quantity) => {
        const result = await cartRepository.updateQuantity(userId, id, quantity);
        if (!result) throw new DataAccessError("not_found", "Cart item not found");
        return result;
      },
      remove: (id) => cartRepository.delete(userId, id),
      clear: () => cartRepository.clearByUserId(userId),
      checkoutItems: async (ids) => {
        const items = selectCheckoutCartItems(
          await cartRepository.findCheckoutStateByUserId(userId),
          ids,
        );
        if (!items) {
          throw new DataAccessError(
            "not_found",
            "One or more checkout items are unavailable",
          );
        }
        return items;
      },
    },
    wishlist: {
      list: () => wishlistRepository.findByUserId(userId),
      listWithDetails: () => wishlistRepository.findByUserIdWithDetails(userId),
      add: async (productId) => {
        const result = await wishlistRepository.createAvailable(userId, productId);
        if (!result) {
          throw new DataAccessError("not_found", "Product is unavailable");
        }
        return result;
      },
      remove: (id) => wishlistRepository.delete(userId, id),
      removeByProduct: (productId) =>
        wishlistRepository.deleteByUserAndProduct(userId, productId),
    },
    orders: {
      list: () => ordersRepository.findByUserId(userId),
      find: (id) => ordersRepository.findByIdForUser(userId, id),
    },
  };
}

function forCatalogManager(value: Principal) {
  assertCapability(value, "catalog:manage");
  return {
    catalog: {
      ...catalog,
      findByIdIncludingArchived: (id: number) =>
        productsRepository.findByIdIncludingArchived(id),
      findEditableById: (id: number) => productsRepository.findEditableById(id),
      findArchivedByIdForRestoration: (id: number) =>
        productsRepository.findArchivedByIdForRestoration(id),
    },
  };
}

function forSystem(value: SystemPrincipal) {
  assertSystemPrincipal(value, "order-fulfillment");
  return {
    fulfillment: fulfillmentRepository,
    checkout: {
      resolve: (intentId: string, checkoutSessionId: string) =>
        checkoutRepository.findBySession(intentId, checkoutSessionId),
    },
    findVariants: async (ids: readonly number[]) => {
      const values = await Promise.all(
        ids.map((id) => productsRepository.findVariantByIdIncludingArchived(id)),
      );
      return values.filter((value): value is NonNullable<typeof value> => Boolean(value));
    },
  };
}

function forFulfillmentOperator(value: Principal) {
  const principal = assertCapability(value, "fulfillment:manage");
  return {
    replayWork: (checkoutSessionId: string, reason: string) =>
      fulfillmentRepository.replayWork({
        checkoutSessionId,
        operatorUserId: principal.userId,
        reason,
      }),
    replayEffect: (effectId: number, reason: string) =>
      fulfillmentRepository.replayEffect({
        effectId,
        operatorUserId: principal.userId,
        reason,
      }),
  };
}

export const dataAccess = {
  catalog,
  forUser,
  forCatalogManager,
  forSystem,
  forFulfillmentOperator,
};

export type UserDataAccess = {
  checkout: {
    createIntent: (
      items: import("@/lib/db/drizzle/schema").CheckoutIntentItem[],
    ) => ReturnType<typeof checkoutRepository.create>;
    bindIntent: (
      intentId: string,
      checkoutSessionId: string,
    ) => ReturnType<typeof checkoutRepository.bind>;
    ownsSession: (
      intentId: string,
      checkoutSessionId: string,
    ) => Promise<boolean>;
  };
  cart: {
    list: () => ReturnType<typeof cartRepository.findByUserId>;
    listWithDetails: () => ReturnType<typeof cartRepository.findByUserIdWithDetails>;
    find: (variantId: number, size: ProductSize) => ReturnType<typeof cartRepository.findOne>;
    add: (item: AddToCartInput) => ReturnType<typeof cartRepository.upsertAvailable>;
    update: (id: number, quantity: number) => ReturnType<typeof cartRepository.updateQuantity>;
    remove: (id: number) => ReturnType<typeof cartRepository.delete>;
    clear: () => ReturnType<typeof cartRepository.clearByUserId>;
    checkoutItems: (
      ids: readonly number[],
    ) => ReturnType<typeof cartRepository.findByUserIdWithDetails>;
  };
  wishlist: {
    list: () => ReturnType<typeof wishlistRepository.findByUserId>;
    listWithDetails: () => ReturnType<typeof wishlistRepository.findByUserIdWithDetails>;
    add: (productId: number) => ReturnType<typeof wishlistRepository.createAvailable>;
    remove: (id: number) => ReturnType<typeof wishlistRepository.delete>;
    removeByProduct: (productId: number) => ReturnType<typeof wishlistRepository.deleteByUserAndProduct>;
  };
  orders: {
    list: () => ReturnType<typeof ordersRepository.findByUserId>;
    find: (id: number) => ReturnType<typeof ordersRepository.findByIdForUser>;
  };
};
