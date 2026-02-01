import { eq, and } from "drizzle-orm";
import { db, withRLS } from "../connection";
import { cartItems, productsVariants, productsItems } from "../schema";
import type {
  CartItem,
  InsertCartItem,
  ProductSize,
} from "@/lib/db/drizzle/schema";

export const cartRepository = {
  async findByUserId(userId: string): Promise<CartItem[]> {
    return withRLS(userId, async () => {
      const result = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.userId, userId));

      return result.map(transformCartItem);
    });
  },

  async findByUserIdWithDetails(userId: string) {
    return withRLS(userId, async () => {
      const result = await db
        .select({
          cartItem: cartItems,
          variant: productsVariants,
          product: productsItems,
        })
        .from(cartItems)
        .innerJoin(
          productsVariants,
          eq(cartItems.variantId, productsVariants.id),
        )
        .innerJoin(
          productsItems,
          eq(productsVariants.productId, productsItems.id),
        )
        .where(eq(cartItems.userId, userId));

      return result.map((row) => ({
        ...transformCartItem(row.cartItem),
        variant: {
          id: row.variant.id,
          productId: row.variant.productId,
          stripeId: row.variant.stripeId,
          color: row.variant.color,
          sizes: row.variant.sizes,
          images: row.variant.images,
          createdAt:
            row.variant.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt:
            row.variant.updatedAt?.toISOString() ?? new Date().toISOString(),
        },
        product: {
          id: row.product.id,
          name: row.product.name,
          description: row.product.description,
          price: Number(row.product.price),
          category: row.product.category,
          img: row.product.img,
          createdAt:
            row.product.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt:
            row.product.updatedAt?.toISOString() ?? new Date().toISOString(),
        },
      }));
    });
  },

  async findOne(
    userId: string,
    variantId: number,
    size: ProductSize,
  ): Promise<CartItem | null> {
    return withRLS(userId, async () => {
      const [result] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.variantId, variantId),
            eq(cartItems.size, size),
          ),
        );

      return result ? transformCartItem(result) : null;
    });
  },

  async upsert(data: InsertCartItem): Promise<CartItem | null> {
    return withRLS(data.userId, async () => {
      const existing = await this.findOneInternal(
        data.userId,
        data.variantId,
        data.size as ProductSize,
      );

      if (existing) {
        return this.updateQuantityInternal(
          existing.id,
          existing.quantity + data.quantity,
        );
      }

      const [result] = await db
        .insert(cartItems)
        .values({
          userId: data.userId,
          variantId: data.variantId,
          quantity: data.quantity,
          size: data.size,
          stripeId: data.stripeId,
        })
        .returning();

      return result ? transformCartItem(result) : null;
    });
  },

  async create(data: InsertCartItem): Promise<CartItem | null> {
    return withRLS(data.userId, async () => {
      const [result] = await db
        .insert(cartItems)
        .values({
          userId: data.userId,
          variantId: data.variantId,
          quantity: data.quantity,
          size: data.size,
          stripeId: data.stripeId,
        })
        .returning();

      return result ? transformCartItem(result) : null;
    });
  },

  async updateQuantity(
    userId: string,
    id: number,
    quantity: number,
  ): Promise<CartItem | null> {
    return withRLS(userId, async () => {
      return this.updateQuantityInternal(id, quantity);
    });
  },

  async delete(userId: string, id: number): Promise<boolean> {
    return withRLS(userId, async () => {
      const result = await db
        .delete(cartItems)
        .where(eq(cartItems.id, id))
        .returning({ id: cartItems.id });

      return result.length > 0;
    });
  },

  async clearByUserId(userId: string): Promise<boolean> {
    return withRLS(userId, async () => {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
      return true;
    });
  },

  // Internal methods (no RLS wrapper, for use within other methods)
  async findOneInternal(
    userId: string,
    variantId: number,
    size: ProductSize,
  ): Promise<CartItem | null> {
    const [result] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.variantId, variantId),
          eq(cartItems.size, size),
        ),
      );

    return result ? transformCartItem(result) : null;
  },

  async updateQuantityInternal(
    id: number,
    quantity: number,
  ): Promise<CartItem | null> {
    const [result] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    return result ? transformCartItem(result) : null;
  },
};

function transformCartItem(row: typeof cartItems.$inferSelect): CartItem {
  return {
    id: row.id,
    userId: row.userId,
    variantId: row.variantId,
    quantity: row.quantity,
    size: row.size,
    stripeId: row.stripeId,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
