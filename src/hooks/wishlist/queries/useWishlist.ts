import { useQuery } from "@tanstack/react-query";
import { WISHLIST_QUERY_KEYS } from "../keys";
import { WishlistItemSchema, type WishlistItem } from "@/schemas/ecommerce";
import { useUser } from "@/hooks/useUser";

type WishlistResponse = { items: WishlistItem[] };

export const useWishlist = () => {
  const { user } = useUser();

  const query = useQuery({
    enabled: !!user?.id,
    queryKey: WISHLIST_QUERY_KEYS.wishlistList(user?.id!),
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

      const data = await response.json();
      return {
        items: WishlistItemSchema.array().parse(data.items),
      } as WishlistResponse;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const items = query.data?.items ?? [];
  const ids = new Set(items.map((i) => i.product_id));
  const isInWishlist = (productId: number) => ids.has(productId);

  return {
    ...query,
    items,
    count: items.length,
    isInWishlist,
  };
};
