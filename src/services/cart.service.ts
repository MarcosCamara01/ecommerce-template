import {
  cartRepository,
  productsRepository,
} from "@/lib/db/drizzle/repositories";
import type {
  CartItem,
  CartItemWithDetails,
  AddToCartInput,
  ProductSize,
} from "@/lib/db/drizzle/schema";

export async function getCart(userId: string): Promise<CartItem[]> {
  try {
    return await cartRepository.findByUserId(userId);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}

export async function getCartWithDetails(
  userId: string,
): Promise<CartItemWithDetails[]> {
  try {
    return await cartRepository.findByUserIdWithDetails(userId);
  } catch (error) {
    console.error("Error fetching cart with details:", error);
    return [];
  }
}

export async function addToCart(
  userId: string,
  cartItem: AddToCartInput,
): Promise<CartItem | null> {
  try {
    // Resolve the Stripe price from the variant itself. The client only says
    // WHICH variant it wants; it never gets to say what that variant costs.
    const variant = await productsRepository.findVariantById(cartItem.variantId);
    if (!variant) {
      console.error("Add to cart rejected: unknown variant", cartItem.variantId);
      return null;
    }

    // The requested size must actually be offered by this variant.
    if (!variant.sizes.includes(cartItem.size)) {
      console.error(
        "Add to cart rejected: size not available for variant",
        cartItem.variantId,
        cartItem.size,
      );
      return null;
    }

    return await cartRepository.upsert({
      ...cartItem,
      userId,
      stripeId: variant.stripeId,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return null;
  }
}

export async function removeFromCart(
  userId: string,
  cartItemId: number,
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
  quantity: number,
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
  size: ProductSize,
): Promise<CartItem | null> {
  try {
    return await cartRepository.findOne(userId, variantId, size);
  } catch (error) {
    console.error("Error finding cart item:", error);
    return null;
  }
}
