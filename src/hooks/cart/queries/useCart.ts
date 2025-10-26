import { useQuery } from "@tanstack/react-query";
import { CART_QUERY_KEYS } from "../keys";
import { CartItemSchema, type CartItem } from "@/schemas/ecommerce";
import { useSession } from "@/libs/auth/client";

type CartResponse = { items: CartItem[] };

export const useCart = () => {
  const { data: session } = useSession();

  const query = useQuery({
    enabled: !!session?.user?.id,
    queryKey: CART_QUERY_KEYS.cartList(session?.user?.id!),
    queryFn: async () => {
      const response = await fetch("/api/user/cart", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      return {
        items: CartItemSchema.array().parse(data.items),
      } as CartResponse;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const items = query.data?.items ?? [];

  const getCartItemById = (id: CartItem["id"]): CartItem | undefined => {
    return items.find((item) => item.id === id);
  };

  return {
    ...query,
    items,
    getCartItemById,
  };
};
