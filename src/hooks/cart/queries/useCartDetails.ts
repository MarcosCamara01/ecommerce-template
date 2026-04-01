import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import {
  cartItemWithDetailsSchema,
  type CartItemWithDetails,
} from "@/lib/db/drizzle/schema";
import { CART_QUERY_KEYS } from "../keys";
import type { CartDetailsResponse } from "../types";

export const useCartDetails = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const query = useQuery({
    enabled: Boolean(userId),
    queryKey: CART_QUERY_KEYS.cartDetails(userId ?? "anonymous"),
    queryFn: async () => {
      const response = await fetch("/api/user/cart?view=details", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart details");
      }

      const data = await response.json();
      return {
        items: cartItemWithDetailsSchema.array().parse(data.items),
      } satisfies CartDetailsResponse;
    },
  });

  const items = query.data?.items ?? [];

  const getCartItemById = (
    id: CartItemWithDetails["id"],
  ): CartItemWithDetails | undefined => {
    return items.find((item) => item.id === id);
  };

  return {
    ...query,
    items,
    getCartItemById,
  };
};
