import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import {
  wishlistItemWithProductSchema,
  type WishlistItemWithProduct,
} from "@/lib/db/drizzle/schema";
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

      const data = await response.json();
      return {
        items: wishlistItemWithProductSchema.array().parse(data.items),
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
