import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { remainingCartQuantity } from "@/lib/cart/remaining-quantity";

import { db, type DatabaseTransaction } from "../connection";
import { cartItems } from "../schema/cart";
import { productsItems, productsVariants } from "../schema/products";
import type {
  CartItem,
  AddToCartInput,
  InsertCartItem,
  ProductSize,
} from "@/lib/db/drizzle/schema";

export const cartRepository = {
  async findByUserId(userId: string): Promise<CartItem[]> {
    const result = await db
      .select({ cartItem: cartItems })
      .from(cartItems)
      .innerJoin(productsVariants, eq(cartItems.variantId, productsVariants.id))
      .innerJoin(productsItems, eq(productsVariants.productId, productsItems.id))
      .where(
        and(
          eq(cartItems.userId, userId),
          isNull(productsVariants.archivedAt),
          isNull(productsItems.archivedAt),
        ),
      );
    return result.map((row) => transformCartItem(row.cartItem));
  },

  async findByUserIdWithDetails(userId: string) {
    const result = await db
      .select({ cartItem: cartItems, variant: productsVariants, product: productsItems })
      .from(cartItems)
      .innerJoin(productsVariants, eq(cartItems.variantId, productsVariants.id))
      .innerJoin(productsItems, eq(productsVariants.productId, productsItems.id))
      .where(
        and(
          eq(cartItems.userId, userId),
          isNull(productsVariants.archivedAt),
          isNull(productsItems.archivedAt),
        ),
      );

    return result.map(transformCartWithDetails);
  },

  async findCheckoutStateByUserId(userId: string) {
    const result = await db
      .select({ cartItem: cartItems, variant: productsVariants, product: productsItems })
      .from(cartItems)
      .leftJoin(productsVariants, eq(cartItems.variantId, productsVariants.id))
      .leftJoin(productsItems, eq(productsVariants.productId, productsItems.id))
      .where(eq(cartItems.userId, userId));

    return result.map((row) => {
      const active = Boolean(
        row.variant &&
          row.product &&
          row.variant.archivedAt === null &&
          row.product.archivedAt === null,
      );
      return {
        cartItemId: row.cartItem.id,
        active,
        item:
          active && row.variant && row.product
            ? transformCartWithDetails({
                cartItem: row.cartItem,
                variant: row.variant,
                product: row.product,
              })
            : null,
      };
    });
  },

  async findOne(userId: string, variantId: number, size: ProductSize) {
    const [result] = await db
      .select({ cartItem: cartItems })
      .from(cartItems)
      .innerJoin(productsVariants, eq(cartItems.variantId, productsVariants.id))
      .innerJoin(productsItems, eq(productsVariants.productId, productsItems.id))
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.variantId, variantId),
          eq(cartItems.size, size),
          isNull(productsVariants.archivedAt),
          isNull(productsItems.archivedAt),
        ),
      );
    return result ? transformCartItem(result.cartItem) : null;
  },

  async upsertAvailable(
    data: AddToCartInput & { userId: string },
  ): Promise<CartItem | null> {
    return db.transaction(async (tx) => {
      const [variantIdentity] = await tx
        .select({ productId: productsVariants.productId })
        .from(productsVariants)
        .where(eq(productsVariants.id, data.variantId));
      if (!variantIdentity) return null;

      const [product] = await tx
        .select({ id: productsItems.id })
        .from(productsItems)
        .where(
          and(
            eq(productsItems.id, variantIdentity.productId),
            isNull(productsItems.archivedAt),
          ),
        )
        .for("share");
      if (!product) return null;

      const [activeVariant] = await tx
        .select({
          stripeId: productsVariants.stripeId,
          sizes: productsVariants.sizes,
        })
        .from(productsVariants)
        .where(
          and(
            eq(productsVariants.id, data.variantId),
            eq(productsVariants.productId, product.id),
            isNull(productsVariants.archivedAt),
          ),
        );
      if (!activeVariant || !activeVariant.sizes.includes(data.size)) return null;
      return upsertInternal(tx, { ...data, stripeId: activeVariant.stripeId });
    });
  },

  async upsert(data: InsertCartItem): Promise<CartItem | null> {
    return db.transaction((tx) => upsertInternal(tx, data));
  },

  async updateQuantity(userId: string, id: number, quantity: number) {
    return updateQuantityInternal(db, userId, id, quantity);
  },

  async delete(userId: string, id: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning({ id: cartItems.id });
    return result.length > 0;
  },

  async clearByUserId(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  },

};

export async function consumePurchasedInTransaction(
  tx: DatabaseTransaction,
  userId: string,
  purchases: readonly { cartItemId: number; quantity: number }[],
): Promise<void> {
  if (purchases.length === 0) return;
  const rows = await tx
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, userId),
        inArray(cartItems.id, purchases.map((item) => item.cartItemId)),
      ),
    )
    .for("update");
  const currentById = new Map(rows.map((row) => [row.id, row.quantity]));

  for (const purchase of purchases) {
    const currentQuantity = currentById.get(purchase.cartItemId);
    if (currentQuantity === undefined) continue;
    const remaining = remainingCartQuantity(currentQuantity, purchase.quantity);
    if (remaining === null) {
      // Inside db.transaction: concurrent statements on one Postgres connection
      // are not safe, so these stay sequential.
      // react-doctor-disable-next-line react-doctor/async-await-in-loop
      await tx
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.id, purchase.cartItemId),
          ),
        );
    } else {
      await tx
        .update(cartItems)
        .set({ quantity: remaining, updatedAt: new Date() })
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.id, purchase.cartItemId),
          ),
        );
    }
  }
}

async function upsertInternal(
  tx: DatabaseTransaction,
  data: InsertCartItem,
): Promise<CartItem | null> {
  const [result] = await tx
    .insert(cartItems)
    .values(data)
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.variantId, cartItems.size],
      set: {
        quantity: sql`${cartItems.quantity} + ${data.quantity}`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result ? transformCartItem(result) : null;
}

type QueryExecutor = Pick<DatabaseTransaction, "update">;

async function updateQuantityInternal(
  executor: QueryExecutor,
  userId: string,
  id: number,
  quantity: number,
): Promise<CartItem | null> {
  const [result] = await executor
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
    .returning();
  return result ? transformCartItem(result) : null;
}

function transformCartItem(row: typeof cartItems.$inferSelect): CartItem {
  return {
    ...row,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function transformCartWithDetails(row: {
  cartItem: typeof cartItems.$inferSelect;
  variant: typeof productsVariants.$inferSelect;
  product: typeof productsItems.$inferSelect;
}) {
  return {
    ...transformCartItem(row.cartItem),
    variant: {
      ...row.variant,
      createdAt: row.variant.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: row.variant.updatedAt?.toISOString() ?? new Date().toISOString(),
    },
    product: {
      ...row.product,
      price: Number(row.product.price),
      createdAt: row.product.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: row.product.updatedAt?.toISOString() ?? new Date().toISOString(),
    },
  };
}
