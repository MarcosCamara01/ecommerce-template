import "server-only";

import { dataAccess } from "@/lib/data-access";
import type { UserPrincipal } from "@/lib/identity";

export const getWishlist = (principal: UserPrincipal) =>
  dataAccess.forUser(principal).wishlist.list();
export const getWishlistWithDetails = (principal: UserPrincipal) =>
  dataAccess.forUser(principal).wishlist.listWithDetails();
export async function isInWishlist(principal: UserPrincipal, productId: number) {
  const items = await getWishlist(principal);
  return items.some((item) => item.productId === productId);
}
export const addToWishlist = (principal: UserPrincipal, productId: number) =>
  dataAccess.forUser(principal).wishlist.add(productId);
export const removeFromWishlist = (principal: UserPrincipal, id: number) =>
  dataAccess.forUser(principal).wishlist.remove(id);
export const removeFromWishlistByProduct = (
  principal: UserPrincipal,
  productId: number,
) => dataAccess.forUser(principal).wishlist.removeByProduct(productId);
