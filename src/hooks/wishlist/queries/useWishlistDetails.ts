import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import type { WishlistItemWithProduct } from "@/lib/db/drizzle/schema";
import { WISHLIST_QUERY_KEYS } from "../keys";
import type { WishlistDetailsResponse } from "../types";

export const useWishlistDetails = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const query = useQuery({
    enabled: Boolean(userId),
    queryKey: WISHLIST_QUERY_KEYS.wishlistDetails(userId ?? "anonymous"),
    queryFn: async () => {
      const response = await fetch("/api/user/wishlist?view=details", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist details");
      }

      const data: { items?: unknown } = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Failed to fetch wishlist details");
      return {
        items: data.items as WishlistItemWithProduct[],
      } satisfies WishlistDetailsResponse;
    },
  });

  const items = query.data?.items ?? [];

  const getWishlistItemById = (
    id: WishlistItemWithProduct["id"],
  ): WishlistItemWithProduct | undefined => {
    return items.find((item) => item.id === id);
  };

  return {
    ...query,
    items,
    getWishlistItemById,
  };
};
