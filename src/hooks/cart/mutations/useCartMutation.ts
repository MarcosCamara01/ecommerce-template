import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cartItemWithDetailsSchema,
  type CartItem,
  type ProductSize,
  selectCartItemSchema,
} from "@/lib/db/drizzle/schema";
import { useSession } from "@/lib/auth/client";
import { toast } from "sonner";
import { CART_QUERY_KEYS } from "../keys";
import type { CartDetailsResponse, CartListResponse } from "../types";

export const useCartMutation = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const add = useMutation({
    mutationFn: async (params: {
      variantId: number;
      size: ProductSize;
      stripeId: string;
      quantity?: number;
    }) => {
      const { variantId, size, stripeId, quantity = 1 } = params;

      const response = await fetch("/api/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, size, stripeId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error adding to cart";
        throw new Error(errorMessage);
      }

      const { item } = await response.json();
      return selectCartItemSchema.parse(item);
    },
    onMutate: async (params: {
      variantId: number;
      size: ProductSize;
      stripeId: string;
      quantity?: number;
    }) => {
      if (!userId) {
        toast.info("Login first to add to cart");
        throw new Error("Unauthorized");
      }

      const { variantId, size, stripeId, quantity = 1 } = params;

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(userId),
      });

      const previousData = queryClient.getQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
      );

      const tempItem = selectCartItemSchema.parse({
        id: -Math.floor(Math.random() * 1e9),
        userId: "temp",
        variantId,
        size,
        quantity,
        stripeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      queryClient.setQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
        (old = { items: [] }) => {
          const idx = old.items.findIndex(
            (i) => i.variantId === variantId && i.size === size,
          );
          if (idx >= 0) {
            const next = [...old.items];
            next[idx] = {
              ...next[idx],
              quantity: next[idx].quantity + quantity,
              updatedAt: new Date().toISOString(),
            };
            return { items: next };
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
        previousData?: CartListResponse;
        tempItem: CartItem;
      };

      queryClient.setQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
        (old = { items: [] }) => {
          const filtered = old.items.filter((i) => i.id !== tempItem.id);
          const idx = filtered.findIndex(
            (i) => i.variantId === data.variantId && i.size === data.size,
          );
          if (idx >= 0) {
            filtered[idx] = data;
            return { items: filtered };
          }
          return { items: [data, ...filtered] };
        },
      );

      void queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.cartDetails(userId),
      });
    },
    onError: (error, _, context) => {
      const { previousData } = context as {
        previousData?: CartListResponse;
        tempItem: CartItem;
      };

      if (previousData && userId) {
        queryClient.setQueryData<CartListResponse>(
          CART_QUERY_KEYS.cartList(userId),
          previousData,
        );
      }

      console.error("Error adding to cart:", error);
      toast.error("Error adding to cart");
    },
  });

  const update = useMutation({
    mutationFn: async (params: { itemId: number; quantity: number }) => {
      const { itemId, quantity } = params;

      const response = await fetch("/api/user/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error updating cart";
        throw new Error(errorMessage);
      }

      const { item } = await response.json();
      return selectCartItemSchema.parse(item);
    },
    onMutate: async (params: { itemId: number; quantity: number }) => {
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { itemId, quantity } = params;

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(userId),
      });

      const previousData = queryClient.getQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
      );
      const previousDetails = queryClient.getQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
      );

      queryClient.setQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
        (current = { items: [] }) => {
          const next = [...current.items];
          const idx = next.findIndex((i) => i.id === itemId);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              quantity,
              updatedAt: new Date().toISOString(),
            };
          }
          return { items: next };
        },
      );

      queryClient.setQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
        (current = { items: [] }) => ({
          items: current.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        }),
      );

      return { previousData, previousDetails };
    },
    onSuccess: (data) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
        (current = { items: [] }) => {
          const next = [...current.items];
          const idx = next.findIndex((i) => i.id === data.id);
          if (idx >= 0) next[idx] = data;
          return { items: next };
        },
      );

      queryClient.setQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
        (current = { items: [] }) => ({
          items: current.items.map((item) =>
            item.id === data.id
              ? cartItemWithDetailsSchema.parse({
                  ...item,
                  ...data,
                })
              : item,
          ),
        }),
      );
    },
    onError: (error, _, context) => {
      const { previousData, previousDetails } = context as {
        previousData?: CartListResponse;
        previousDetails?: CartDetailsResponse;
      };

      if (previousData && userId) {
        queryClient.setQueryData<CartListResponse>(
          CART_QUERY_KEYS.cartList(userId),
          previousData,
        );
      }

      if (previousDetails && userId) {
        queryClient.setQueryData<CartDetailsResponse>(
          CART_QUERY_KEYS.cartDetails(userId),
          previousDetails,
        );
      }

      console.error("Error updating cart:", error);
      toast.error("Error updating cart");
    },
  });

  const remove = useMutation({
    mutationFn: async (params: { itemId: number }) => {
      const { itemId } = params;

      const qs = new URLSearchParams();
      qs.set("itemId", String(itemId));

      const response = await fetch(`/api/user/cart?${qs.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error removing from cart";
        throw new Error(errorMessage);
      }

      return true;
    },
    onMutate: async (params: { itemId: number }) => {
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { itemId } = params;

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(userId),
      });

      const previousData = queryClient.getQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
      );
      const previousDetails = queryClient.getQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
      );

      queryClient.setQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
        (current = { items: [] }) => ({
          items: current.items.filter((i) => i.id !== itemId),
        }),
      );

      queryClient.setQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
        (current = { items: [] }) => ({
          items: current.items.filter((item) => item.id !== itemId),
        }),
      );

      return { previousData, previousDetails };
    },
    onError: (error, _, context) => {
      const { previousData, previousDetails } = context as {
        previousData?: CartListResponse;
        previousDetails?: CartDetailsResponse;
      };

      if (previousData && userId) {
        queryClient.setQueryData<CartListResponse>(
          CART_QUERY_KEYS.cartList(userId),
          previousData,
        );
      }

      if (previousDetails && userId) {
        queryClient.setQueryData<CartDetailsResponse>(
          CART_QUERY_KEYS.cartDetails(userId),
          previousDetails,
        );
      }

      console.error("Error removing from cart:", error);
      toast.error("Error removing from cart");
    },
  });

  const clear = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/cart", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error clearing cart";
        throw new Error(errorMessage);
      }

      return true;
    },
    onMutate: async () => {
      if (!userId) {
        throw new Error("Unauthorized");
      }

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(userId),
      });

      const previousData = queryClient.getQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
      );
      const previousDetails = queryClient.getQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
      );

      queryClient.setQueryData<CartListResponse>(
        CART_QUERY_KEYS.cartList(userId),
        { items: [] },
      );

      queryClient.setQueryData<CartDetailsResponse>(
        CART_QUERY_KEYS.cartDetails(userId),
        { items: [] },
      );

      return { previousData, previousDetails };
    },
    onError: (error, _, context) => {
      const { previousData, previousDetails } = context as {
        previousData?: CartListResponse;
        previousDetails?: CartDetailsResponse;
      };

      if (previousData && userId) {
        queryClient.setQueryData<CartListResponse>(
          CART_QUERY_KEYS.cartList(userId),
          previousData,
        );
      }

      if (previousDetails && userId) {
        queryClient.setQueryData<CartDetailsResponse>(
          CART_QUERY_KEYS.cartDetails(userId),
          previousDetails,
        );
      }

      console.error("Error clearing cart:", error);
      toast.error("Error clearing cart");
    },
  });

  return {
    add: add.mutate,
    update: update.mutate,
    remove: remove.mutate,
    clear: clear.mutate,
    isAdding: add.isPending,
    isUpdating: update.isPending,
    isRemoving: remove.isPending,
    isClearing: clear.isPending,
    addError: add.error,
    updateError: update.error,
    removeError: remove.error,
    clearError: clear.error,
  };
};
