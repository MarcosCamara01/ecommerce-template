import type {
  WishlistItem,
  WishlistItemWithProduct,
} from "@/lib/db/drizzle/schema";

export type WishlistListResponse = {
  items: WishlistItem[];
};

export type WishlistDetailsResponse = {
  items: WishlistItemWithProduct[];
};
