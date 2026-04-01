import type { CartItem, CartItemWithDetails } from "@/lib/db/drizzle/schema";

export type CartListResponse = {
  items: CartItem[];
};

export type CartDetailsResponse = {
  items: CartItemWithDetails[];
};
