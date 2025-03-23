/** FUNCTIONALITY */
import { supabase } from "@/libs/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
/** TYPES */
import { Wishlist, type WishlistItem } from "@/schemas/ecommerce";

export function useRemoveItem(itemId: WishlistItem["id"]) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationKey: ["whishlist", user?.id],
    onMutate: async () => {
      const previousItems = queryClient.getQueryData<WishlistItem[]>([
        "whishlist",
        user?.id,
      ]);

      queryClient.setQueryData<WishlistItem[]>(
        ["whishlist", user?.id],
        (items) => {
          if (!items) return undefined;
          return items.filter((item) => item.id !== itemId);
        }
      );

      return { previousItems };
    },
    mutationFn: async () => {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", itemId);

      if (error) {
        throw error;
      }
    },
    onError: (error, _, context) => {
      console.error("Error removing item:", error);
      if (context?.previousItems) {
        queryClient.setQueryData(
          ["whishlist", user?.id],
          context.previousItems
        );
      }
    },
  });

  return { remove: mutate, isPending, isError };
}
