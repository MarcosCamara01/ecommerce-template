/** FUNCTIONALITY */
import { supabase } from "@/libs/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
/** TYPES */
import { CartItems, type CartItem } from "@/schemas/ecommerce";

export function useEditCart() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { mutate: originalMutate, ...rest } = useMutation({
    mutationKey: ["cart", user?.id],
    onMutate: async (update: Partial<CartItem>) => {
      const previousItems = queryClient.getQueryData<CartItem[]>([
        "cart",
        user?.id,
      ]);

      queryClient.setQueryData<CartItem[]>(["cart", user?.id], (items) => {
        if (!items) return undefined;
        return items.map((item: CartItem) =>
          item.id === update.id
            ? CartItems.parse({ 
                ...item, 
                ...update, 
                updated_at: new Date().toISOString() 
              })
            : item
        );
      });

      return { previousItems };
    },
    mutationFn: async (update: Partial<CartItem>) => {
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          ...update,
          updated_at: new Date().toISOString()
        })
        .eq("id", update.id)
        .select("id")
        .single<Required<Pick<CartItem, "id">>>();

      if (error) throw error;

      return data;
    },
    onError: (error, variables, context) => {
      console.error("Error editing item:", error);

      if (context?.previousItems) {
        queryClient.setQueryData(["cart", user?.id], context.previousItems);
      }
    },
  });

  const edit = (update: Partial<CartItem>) => {
    return new Promise<number>((resolve, reject) => {
      originalMutate(update, {
        onSuccess: (editedItem) => {
          resolve(editedItem.id);
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  };

  return { edit, ...rest };
}
