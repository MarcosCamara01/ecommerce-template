// Cart business logic

import type { CartLineItem, Cart } from "@/types/domain";

export function calculateCartTotal(items: CartLineItem[]): Cart {
  const subtotal = items.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.21); // 21% IVA
  const total = subtotal + tax;

  return {
    items,
    subtotal,
    tax,
    total,
  };
}

export function validateCartItem(item: Partial<CartLineItem>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.productId) errors.push("Product ID is required");
  if (!item.variantId) errors.push("Variant ID is required");
  if (!item.quantity || item.quantity <= 0)
    errors.push("Quantity must be greater than 0");
  if (!item.size) errors.push("Size is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function mergeCartItems(items: CartLineItem[]): CartLineItem[] {
  const merged = new Map<string, CartLineItem>();

  items.forEach((item) => {
    const key = `${item.variantId}-${item.size}`;
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.set(key, { ...item });
    }
  });

  return Array.from(merged.values());
}
