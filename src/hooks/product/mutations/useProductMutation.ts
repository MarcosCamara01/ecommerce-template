import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CART_QUERY_KEYS } from "@/hooks/cart/keys";
import { WISHLIST_QUERY_KEYS } from "@/hooks/wishlist/keys";
import { useSession } from "@/lib/auth/client";
import { createProduct, updateProduct } from "./productMutations";

export const useProductMutation = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // No cache to synchronize: a product that did not exist yet cannot appear
  // in any cached cart or wishlist. The listing pages are server components.
  // react-doctor-disable-next-line react-doctor/query-mutation-missing-invalidation
  const create = useMutation({
    mutationFn: createProduct,
    onError: (error) => {
      console.error("Error al crear el producto:", error);
    },
  });

  const update = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      // Cart and wishlist details embed the full product and variant rows, so
      // editing a product leaves them stale until they are invalidated.
      if (!userId) return;
      void queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.cartList(userId),
      });
      void queryClient.invalidateQueries({
        queryKey: WISHLIST_QUERY_KEYS.wishlistList(userId),
      });
    },
    onError: (error) => {
      console.error("Error al actualizar el producto:", error);
    },
  });

  return {
    // Create mutations
    create: create.mutate,
    createAsync: create.mutateAsync,
    isPending: create.isPending,
    isError: create.isError,
    isSuccess: create.isSuccess,
    error: create.error,
    // Update mutations
    update: update.mutate,
    updateAsync: update.mutateAsync,
    isUpdatePending: update.isPending,
    isUpdateError: update.isError,
    isUpdateSuccess: update.isSuccess,
    updateError: update.error,
  };
};
