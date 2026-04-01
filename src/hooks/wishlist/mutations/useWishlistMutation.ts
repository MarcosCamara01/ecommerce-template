import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  selectWishlistItemSchema,
  type WishlistItem,
} from "@/lib/db/drizzle/schema";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { WISHLIST_QUERY_KEYS } from "../keys";
import type { WishlistDetailsResponse, WishlistListResponse } from "../types";

export const useWishlistMutation = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const add = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch("/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error at adding to wishlist";
        throw new Error(errorMessage);
      }

      const { item } = await response.json();
      return selectWishlistItemSchema.parse(item);
    },
    onMutate: async (productId: number) => {
      if (!userId) {
        toast.info("Login first to add to wishlist");
        throw new Error("Unauthorized");
      }

      await queryClient.cancelQueries({
        queryKey: WISHLIST_QUERY_KEYS.wishlistList(userId),
      });

      const previousData = queryClient.getQueryData<WishlistListResponse>(
        WISHLIST_QUERY_KEYS.wishlistList(userId),
      );

      const tempItem: WishlistItem = {
        id: -Math.floor(Math.random() * 1e9),
        userId: "temp",
        productId: productId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<WishlistListResponse>(
        WISHLIST_QUERY_KEYS.wishlistList(userId),
        (old = { items: [] }) => {
          if (old.items.some((w) => w.productId === productId)) {
            return old;
          }
          return { items: [tempItem, ...old.items] };
        },
      );

      return { previousData, tempItem };
    },
    onSuccess: (data, _, context) => {
      if (!userId) {
        return;
      }

      const { tempItem } = context as {
        previousData?: WishlistListResponse;
        tempItem: WishlistItem;
      };

      queryClient.setQueryData<WishlistListResponse>(
        WISHLIST_QUERY_KEYS.wishlistList(userId),
        (old = { items: [] }) => ({
          items: old.items
            .filter((i) => i.id !== tempItem.id)
            .filter((i) => i.productId !== data.productId)
            .concat(data),
        }),
      );

      void queryClient.invalidateQueries({
        queryKey: WISHLIST_QUERY_KEYS.wishlistDetails(userId),
      });
    },
    onError: (error, _, context) => {
      const { previousData } = context as {
        previousData?: WishlistListResponse;
        tempItem: WishlistItem;
      };
      if (previousData && userId) {
        queryClient.setQueryData<WishlistListResponse>(
          WISHLIST_QUERY_KEYS.wishlistList(userId),
          previousData,
        );
      }

      console.error("Error adding to wishlist:", error);
      toast.error("Error adding to wishlist");
    },
  });

  const remove = useMutation({
    mutationFn: async (params: { itemId?: number; productId?: number }) => {
      const qs = new URLSearchParams();
      if (params.itemId) qs.set("itemId", String(params.itemId));
      if (params.productId) qs.set("productId", String(params.productId));

      const response = await fetch(`/api/user/wishlist?${qs.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error removing from wishlist";
        throw new Error(errorMessage);
      }

      return true;
    },
    onMutate: async (params: { itemId?: number; productId?: number }) => {
      if (!userId) {
        throw new Error("Unauthorized");
      }

      await queryClient.cancelQueries({
        queryKey: WISHLIST_QUERY_KEYS.wishlistList(userId),
      });

      const previousData = queryClient.getQueryData<WishlistListResponse>(
        WISHLIST_QUERY_KEYS.wishlistList(userId),
      );
      const previousDetails = queryClient.getQueryData<WishlistDetailsResponse>(
        WISHLIST_QUERY_KEYS.wishlistDetails(userId),
      );

      queryClient.setQueryData<WishlistListResponse>(
        WISHLIST_QUERY_KEYS.wishlistList(userId),
        (current = { items: [] }) => ({
          items: current.items.filter((i) =>
            params.itemId
              ? i.id !== params.itemId
              : i.productId !== params.productId,
          ),
        }),
      );

      queryClient.setQueryData<WishlistDetailsResponse>(
        WISHLIST_QUERY_KEYS.wishlistDetails(userId),
        (current = { items: [] }) => ({
          items: current.items.filter((item) =>
            params.itemId
              ? item.id !== params.itemId
              : item.productId !== params.productId,
          ),
        }),
      );

      return { previousData, previousDetails };
    },
    onError: (error, _, context) => {
      const { previousData, previousDetails } = context as {
        previousData?: WishlistListResponse;
        previousDetails?: WishlistDetailsResponse;
      };

      if (previousData && userId) {
        queryClient.setQueryData<WishlistListResponse>(
          WISHLIST_QUERY_KEYS.wishlistList(userId),
          previousData,
        );
      }

      if (previousDetails && userId) {
        queryClient.setQueryData<WishlistDetailsResponse>(
          WISHLIST_QUERY_KEYS.wishlistDetails(userId),
          previousDetails,
        );
      }

      console.error("Error removing from wishlist:", error);
      toast.error("Error removing from wishlist");
    },
    onSuccess: () => {
      if (!userId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: WISHLIST_QUERY_KEYS.wishlistDetails(userId),
      });
    },
  });

  return {
    add: add.mutate,
    remove: remove.mutate,
    addAsync: add.mutateAsync,
    removeAsync: remove.mutateAsync,
    error: add.error || remove.error,
    isAddingToWishlist: add.isPending,
    isRemovingFromWishlist: remove.isPending,
    addError: add.error,
    removeError: remove.error,
  };
};
