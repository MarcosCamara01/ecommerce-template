import "server-only";

import { dataAccess } from "@/lib/data-access";
import type { UserPrincipal } from "@/lib/identity";
import type { AddToCartInput, ProductSize } from "@/lib/db/drizzle/schema";

export const getCart = (principal: UserPrincipal) =>
  dataAccess.forUser(principal).cart.list();
export const getCartWithDetails = (principal: UserPrincipal) =>
  dataAccess.forUser(principal).cart.listWithDetails();
export const addToCart = (principal: UserPrincipal, item: AddToCartInput) =>
  dataAccess.forUser(principal).cart.add(item);
export const removeFromCart = (principal: UserPrincipal, id: number) =>
  dataAccess.forUser(principal).cart.remove(id);
export const updateCartItem = (
  principal: UserPrincipal,
  id: number,
  quantity: number,
) => dataAccess.forUser(principal).cart.update(id, quantity);
export const clearCart = (principal: UserPrincipal) =>
  dataAccess.forUser(principal).cart.clear();
export const findCartItem = (
  principal: UserPrincipal,
  variantId: number,
  size: ProductSize,
) => dataAccess.forUser(principal).cart.find(variantId, size);
