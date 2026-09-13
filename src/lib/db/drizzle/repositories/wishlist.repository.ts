import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "../connection";
import { productsItems, productsVariants } from "../schema/products";
import { wishlist } from "../schema/wishlist";
import type { WishlistItem } from "@/lib/db/drizzle/schema";

export const wishlistRepository = {
  async findByUserId(userId: string): Promise<WishlistItem[]> {
    const result = await db
      .select({ wishlistItem: wishlist })
      .from(wishlist)
      .innerJoin(productsItems, eq(wishlist.productId, productsItems.id))
      .where(
        and(
          eq(wishlist.userId, userId),
          isNull(productsItems.archivedAt),
        ),
      )
      .orderBy(desc(wishlist.createdAt));
    return result.map((row) => transformWishlistItem(row.wishlistItem));
  },

  async findByUserIdWithDetails(userId: string) {
    const result = await db
      .select({ wishlistItem: wishlist, product: productsItems })
      .from(wishlist)
      .innerJoin(productsItems, eq(wishlist.productId, productsItems.id))
      .where(
        and(
          eq(wishlist.userId, userId),
          isNull(productsItems.archivedAt),
        ),
      )
      .orderBy(desc(wishlist.createdAt));
    const productIds = result.map((row) => row.product.id);
    const variants = productIds.length
      ? await db
          .select()
          .from(productsVariants)
          .where(
            and(
              inArray(productsVariants.productId, productIds),
              isNull(productsVariants.archivedAt),
            ),
          )
      : [];
    const variantsByProduct = new Map<number, typeof variants>();
    for (const variant of variants) {
      const values = variantsByProduct.get(variant.productId) ?? [];
      values.push(variant);
      variantsByProduct.set(variant.productId, values);
    }
    return result.map((row) => ({
      ...transformWishlistItem(row.wishlistItem),
      product: {
        ...row.product,
        price: Number(row.product.price),
        createdAt: row.product.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: row.product.updatedAt?.toISOString() ?? new Date().toISOString(),
        variants: (variantsByProduct.get(row.product.id) ?? []).map((variant) => ({
          ...variant,
          createdAt: variant.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: variant.updatedAt?.toISOString() ?? new Date().toISOString(),
        })),
      },
    }));
  },

  async create(userId: string, productId: number): Promise<WishlistItem> {
    const [result] = await db
      .insert(wishlist)
      .values({ userId, productId })
      .onConflictDoUpdate({
        target: [wishlist.userId, wishlist.productId],
        set: { updatedAt: new Date() },
      })
      .returning();
    if (!result) throw new Error("Wishlist insert returned no row");
    return transformWishlistItem(result);
  },

  async createAvailable(
    userId: string,
    productId: number,
  ): Promise<WishlistItem | null> {
    return db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: productsItems.id })
        .from(productsItems)
        .where(
          and(
            eq(productsItems.id, productId),
            isNull(productsItems.archivedAt),
          ),
        )
        .for("share");
      if (!product) return null;

      const [result] = await tx
        .insert(wishlist)
        .values({ userId, productId })
        .onConflictDoUpdate({
          target: [wishlist.userId, wishlist.productId],
          set: { updatedAt: new Date() },
        })
        .returning();
      if (!result) throw new Error("Wishlist insert returned no row");
      return transformWishlistItem(result);
    });
  },

  async delete(userId: string, id: number): Promise<boolean> {
    const rows = await db
      .delete(wishlist)
      .where(and(eq(wishlist.id, id), eq(wishlist.userId, userId)))
      .returning({ id: wishlist.id });
    return rows.length > 0;
  },

  async deleteByUserAndProduct(userId: string, productId: number) {
    const rows = await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
      .returning({ id: wishlist.id });
    return rows.length > 0;
  },
};

function transformWishlistItem(row: typeof wishlist.$inferSelect): WishlistItem {
  return {
    ...row,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
