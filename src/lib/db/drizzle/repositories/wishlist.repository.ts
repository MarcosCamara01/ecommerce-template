import { eq, and, desc } from "drizzle-orm";
import { db, withRLS } from "../connection";
import { wishlist, productsItems, productsVariants } from "../schema";
import type { WishlistItem, InsertWishlistItem } from "@/schemas";

export const wishlistRepository = {
  async findByUserId(userId: string): Promise<WishlistItem[]> {
    return withRLS(userId, async () => {
      const result = await db
        .select()
        .from(wishlist)
        .where(eq(wishlist.userId, userId))
        .orderBy(desc(wishlist.createdAt));

      return result.map(transformWishlistItem);
    });
  },

  async findByUserIdWithDetails(userId: string) {
    return withRLS(userId, async () => {
      const result = await db
        .select({
          wishlistItem: wishlist,
          product: productsItems,
        })
        .from(wishlist)
        .innerJoin(productsItems, eq(wishlist.productId, productsItems.id))
        .where(eq(wishlist.userId, userId))
        .orderBy(desc(wishlist.createdAt));

      const productIds = result.map((r) => r.product.id);
      const variants = await db
        .select()
        .from(productsVariants)
        .where(
          productIds.length > 0
            ? eq(productsVariants.productId, productIds[0])
            : undefined
        );

      const variantsByProduct = new Map<number, typeof variants>();
      for (const variant of variants) {
        const existing = variantsByProduct.get(variant.productId) || [];
        existing.push(variant);
        variantsByProduct.set(variant.productId, existing);
      }

      return result.map((row) => ({
        ...transformWishlistItem(row.wishlistItem),
        product: {
          id: row.product.id,
          name: row.product.name,
          description: row.product.description,
          price: Number(row.product.price),
          category: row.product.category,
          img: row.product.img,
          createdAt: row.product.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: row.product.updatedAt?.toISOString() ?? new Date().toISOString(),
          variants: (variantsByProduct.get(row.product.id) || []).map((v) => ({
            id: v.id,
            productId: v.productId,
            stripeId: v.stripeId,
            color: v.color,
            sizes: v.sizes,
            images: v.images,
            createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
            updatedAt: v.updatedAt?.toISOString() ?? new Date().toISOString(),
          })),
        },
      }));
    });
  },

  async exists(userId: string, productId: number): Promise<boolean> {
    return withRLS(userId, async () => {
      const [result] = await db
        .select({ id: wishlist.id })
        .from(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

      return !!result;
    });
  },

  async create(data: InsertWishlistItem): Promise<WishlistItem | null> {
    return withRLS(data.userId, async () => {
      const [existing] = await db
        .select({ id: wishlist.id })
        .from(wishlist)
        .where(
          and(eq(wishlist.userId, data.userId), eq(wishlist.productId, data.productId))
        );

      if (existing) return null;

      const [result] = await db
        .insert(wishlist)
        .values({ userId: data.userId, productId: data.productId })
        .returning();

      return result ? transformWishlistItem(result) : null;
    });
  },

  async delete(userId: string, id: number): Promise<boolean> {
    return withRLS(userId, async () => {
      const result = await db
        .delete(wishlist)
        .where(eq(wishlist.id, id))
        .returning({ id: wishlist.id });

      return result.length > 0;
    });
  },

  async deleteByUserAndProduct(userId: string, productId: number): Promise<boolean> {
    return withRLS(userId, async () => {
      const result = await db
        .delete(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
        .returning({ id: wishlist.id });

      return result.length > 0;
    });
  },

  async toggle(
    userId: string,
    productId: number
  ): Promise<{ added: boolean; item: WishlistItem | null }> {
    return withRLS(userId, async () => {
      const [existing] = await db
        .select({ id: wishlist.id })
        .from(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));

      if (existing) {
        await db
          .delete(wishlist)
          .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
        return { added: false, item: null };
      }

      const [result] = await db
        .insert(wishlist)
        .values({ userId, productId })
        .returning();

      return {
        added: true,
        item: result ? transformWishlistItem(result) : null,
      };
    });
  },

  async clearByUserId(userId: string): Promise<boolean> {
    return withRLS(userId, async () => {
      await db.delete(wishlist).where(eq(wishlist.userId, userId));
      return true;
    });
  },
};

function transformWishlistItem(row: typeof wishlist.$inferSelect): WishlistItem {
  return {
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
