/** FUNCTIONALITY */
import { supabase } from "@/libs/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
/** TYPES */
import { type CartItem } from "@/schemas/ecommerce";

export function useRemoveItem(itemId: CartItem["id"]) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationKey: ["cart", user?.id],
    onMutate: async () => {
      const previousItems = queryClient.getQueryData<CartItem[]>([
        "cart",
        user?.id,
      ]);

      queryClient.setQueryData<CartItem[]>(["cart", user?.id], (items) => {
        if (!items) return undefined;
        return items.filter((item) => item.id !== itemId);
      });

      return { previousItems };
    },
    mutationFn: async () => {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        throw error;
      }
    },
    onError: (error, _, context) => {
      console.error("Error removing item:", error);
      if (context?.previousItems) {
        queryClient.setQueryData(["cart", user?.id], context.previousItems);
      }
    }
  });

  return { remove: mutate, isPending, isError };
}
