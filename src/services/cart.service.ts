import { cartRepository } from "@/lib/db/drizzle/repositories";
import type { CartItem, AddToCartInput, ProductSize } from "@/schemas";

export async function getCart(userId: string): Promise<CartItem[]> {
  try {
    return await cartRepository.findByUserId(userId);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

export async function getCartWithDetails(userId: string) {
  try {
    return await cartRepository.findByUserIdWithDetails(userId);
  } catch (error) {
    console.error("Error fetching cart with details:", error);
    return [];
  }
}

export async function addToCart(
  userId: string,
  cartItem: AddToCartInput
): Promise<CartItem | null> {
  try {
    return await cartRepository.upsert({
      ...cartItem,
      userId,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return null;
  }
}

export async function removeFromCart(
  userId: string,
  cartItemId: number
): Promise<boolean> {
  try {
    return await cartRepository.delete(userId, cartItemId);
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
}

export async function updateCartItem(
  userId: string,
  cartItemId: number,
  quantity: number
): Promise<CartItem | null> {
  try {
    return await cartRepository.updateQuantity(userId, cartItemId, quantity);
  } catch (error) {
    console.error("Error updating cart item:", error);
    return null;
  }
}

export async function clearCart(userId: string): Promise<boolean> {
  try {
    return await cartRepository.clearByUserId(userId);
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
}

export async function findCartItem(
  userId: string,
  variantId: number,
  size: ProductSize
): Promise<CartItem | null> {
  try {
    return await cartRepository.findOne(userId, variantId, size);
  } catch (error) {
    console.error("Error finding cart item:", error);
    return null;
  }
}
