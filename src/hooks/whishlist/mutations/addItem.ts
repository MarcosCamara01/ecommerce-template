import { supabase } from "@/libs/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type WishlistItem, Wishlist } from "@/schemas/ecommerce";
import { useUser } from "@/hooks/useUser";

export function useAddItem() {
  const { user } = useUser();

  const { mutate: originalMutate, ...rest } = useMutation({
    mutationKey: ["whishlist", user?.id],
    mutationFn: async (
      item: Partial<Omit<WishlistItem, "id" | "created_at">>
    ) => {
      const { data: newItem, error } = await supabase
        .from("wishlist")
        .insert(
          Wishlist.omit({
            id: true,
            created_at: true,
          }).parse(item)
        )
        .select("*")
        .single<Required<WishlistItem>>();

      if (error) throw error;

      return newItem;
    },
    onError: (error) => {
      console.error("Error adding item to wishlist:", error);
    },
    onSuccess: (newItem) => {
      console.log("Item added to wishlist:", newItem);
    },
  });

  const create = (
    item: Partial<Omit<WishlistItem, "id" | "created_at">> = {}
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
