import { useQuery } from "@tanstack/react-query";
import { WISHLIST_QUERY_KEYS } from "../keys";
import type { WishlistItem } from "@/lib/db/drizzle/schema";
import { useSession } from "@/lib/auth/client";
import type { WishlistListResponse } from "../types";

export const useWishlist = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const query = useQuery({
    enabled: Boolean(userId),
    queryKey: WISHLIST_QUERY_KEYS.wishlistList(userId ?? "anonymous"),
    queryFn: async () => {
      const response = await fetch("/api/user/wishlist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar el wishlist");
      }

      const data: { items?: unknown } = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Error al cargar el wishlist");
      return { items: data.items as WishlistItem[] } satisfies WishlistListResponse;
    },
  });

  const items = query.data?.items ?? [];
  const ids = new Set(items.map((i) => i.productId));
  const isInWishlist = (productId: number) => ids.has(productId);

  return {
    ...query,
    items,
    count: items.length,
    isInWishlist,
  };
};
