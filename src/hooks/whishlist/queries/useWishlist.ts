/** FUNCTIONALITY */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/libs/supabase";
import { useUser } from "@/hooks/useUser";
/** TYPES */
import type { WishlistItem } from "@/schemas/ecommerce";

export function useWishlist() {
  const { user } = useUser();

  return useQuery({
    enabled: !!user?.id,
    queryKey: ["whishlist", user?.id],
    placeholderData: [],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .order("updated_at", { ascending: false })
        .returns<WishlistItem[]>();

      if (error) throw error;

      return data;
    },
    select: (data: WishlistItem[]): WishlistItem[] => {
      return !!user?.id
        ? data.filter((wishlist) => wishlist.user_id === user?.id)
        : data;
    },
  });
}
