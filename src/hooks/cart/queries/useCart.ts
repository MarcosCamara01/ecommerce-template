/** FUNCTIONALITY */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/libs/supabase";
import { useUser } from "@/hooks/useUser";
/** TYPES */
import type { CartItem } from "@/schemas/ecommerce";

export function useCart() {
  const { user } = useUser();

  return useQuery({
    enabled: !!user?.id,
    queryKey: ["cart", user?.id],
    placeholderData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*")
        .order("updated_at", { ascending: false })
        .returns<CartItem[]>();

      if (error) throw error;

      return data;
    },
    select: (data: CartItem[]): CartItem[] => {
      return !!user?.id
        ? data.filter((cart) => cart.user_id === user?.id)
        : data;
    },
  });
}
