"use server";

// Cart API service

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cartItems } from "@/lib/db/schema";
import type { CartItem } from "@/schemas";

export async function getCart(userId: string): Promise<CartItem[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    return await db.query.cartItems.findMany({
      where: eq(cartItems.user_id, userId),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

export async function addToCart(
  userId: string,
  cartItem: Omit<CartItem, "id" | "created_at" | "updated_at" | "user_id">
): Promise<CartItem | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const [inserted] = await db
      .insert(cartItems)
      .values({ ...cartItem, user_id: userId })
      .returning();

    return inserted ?? null;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return null;
  }
}

export async function removeFromCart(cartItemId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
    return true;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
}

export async function updateCartItem(
  cartItemId: number,
  quantity: number
): Promise<CartItem | null> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
}

export async function clearCart(userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not configured");
    }
    await db.delete(cartItems).where(eq(cartItems.user_id, userId));
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
}
