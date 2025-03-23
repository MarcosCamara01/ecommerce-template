/** FUNCTIONALITY */
import { supabase } from "@/libs/supabase";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
/** TYPES */
import { type CartItem, CartItems } from "@/schemas/ecommerce";

export function useAddItem() {
  const { user } = useUser();

  const { mutate: originalMutate, ...rest } = useMutation({
    mutationKey: ["cart", user?.id],
    mutationFn: async (
      item: Partial<Omit<CartItem, "id" | "created_at" | "updated_at">>
    ) => {
      const { data: newItem, error } = await supabase
        .from("cart_items")
        .insert(
          CartItems.omit({
            id: true,
            created_at: true,
            updated_at: true,
          }).parse(item)
        )
        .select("*")
        .single<Required<CartItem>>();

      if (error) throw error;

      return newItem;
    },
    onError: (error) => {
      console.error("Error creating item:", error);
    },
    onSuccess: (newItem) => {
      console.log("Item added to cart:", newItem);
    },
  });

  const create = (
    item: Partial<Omit<CartItem, "id" | "created_at" | "updated_at">> = {}
  ) => {
    return new Promise<number>((resolve, reject) => {
      originalMutate(item, {
        onSuccess: (newItem) => {
          resolve(newItem.id);
        },
        onError: (error) => {
          reject(error);
        },
      });
    });
  };

  return { create, ...rest };
}
