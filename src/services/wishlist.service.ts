import { wishlistRepository } from "@/lib/db/drizzle/repositories";
import type { WishlistItem } from "@/schemas";

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    return await wishlistRepository.findByUserId(userId);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
}

export async function getWishlistWithDetails(userId: string) {
  try {
    return await wishlistRepository.findByUserIdWithDetails(userId);
  } catch (error) {
    console.error("Error fetching wishlist with details:", error);
    return [];
  }
}

export async function isInWishlist(
  userId: string,
  productId: number
): Promise<boolean> {
  try {
    return await wishlistRepository.exists(userId, productId);
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
}

export async function addToWishlist(
  userId: string,
  productId: number
): Promise<WishlistItem | null> {
  try {
    return await wishlistRepository.create({ userId, productId });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return null;
  }
}

export async function removeFromWishlist(
  userId: string,
  wishlistItemId: number
): Promise<boolean> {
  try {
    return await wishlistRepository.delete(userId, wishlistItemId);
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }
}

export async function removeFromWishlistByProduct(
  userId: string,
  productId: number
): Promise<boolean> {
  try {
    return await wishlistRepository.deleteByUserAndProduct(userId, productId);
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }
}

export async function toggleWishlist(
  userId: string,
  productId: number
): Promise<{ added: boolean; item: WishlistItem | null }> {
  try {
    return await wishlistRepository.toggle(userId, productId);
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return { added: false, item: null };
  }
}

export async function clearWishlist(userId: string): Promise<boolean> {
  try {
    return await wishlistRepository.clearByUserId(userId);
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    return false;
  }
}
