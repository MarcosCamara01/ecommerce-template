import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CartItemSchema,
  type CartItem,
  type ProductSize,
} from "@/schemas/ecommerce";
import { useSession } from "@/libs/auth/client";
import { toast } from "sonner";
import { CART_QUERY_KEYS } from "../keys";

type CartResponse = { items: CartItem[] };

export const useCartMutation = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (params: {
      variant_id: number;
      size: ProductSize;
      stripe_id: string;
      quantity?: number;
    }) => {
      const { variant_id, size, stripe_id, quantity = 1 } = params;

      const response = await fetch("/api/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_id, size, stripe_id, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Error adding to cart";
        throw new Error(errorMessage);
      }

      const { item } = await response.json();
      return CartItemSchema.parse(item);
    },
    onMutate: async (params: {
      variant_id: number;
      size: ProductSize;
      stripe_id: string;
      quantity?: number;
    }) => {
      if (!session?.user?.id) {
        toast.info("Login first to add to cart");
        throw new Error("Unauthorized");
      }

      const { variant_id, size, stripe_id, quantity = 1 } = params;

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(session.user.id),
      });

      const previousData = queryClient.getQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id)
      );

      const tempItem = CartItemSchema.parse({
        id: -Math.floor(Math.random() * 1e9),
        user_id: "temp",
        variant_id,
        size,
        quantity,
        stripe_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      queryClient.setQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id),
        (old = { items: [] }) => {
          const idx = old.items.findIndex(
            (i) => i.variant_id === variant_id && i.size === size
          );
          if (idx >= 0) {
            const next = [...old.items];
            next[idx] = {
              ...next[idx],
              quantity: next[idx].quantity + quantity,
              updated_at: new Date().toISOString(),
            };
            return { items: next };
          }
          return { items: [tempItem, ...old.items] };
        }
      );

      return { previousData, tempItem };
    },
    onSuccess: (data, _, context) => {
      const { tempItem } = context as {
        previousData?: CartResponse;
        tempItem: CartItem;
      };

      queryClient.setQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session?.user?.id!),
        (old = { items: [] }) => {
          const filtered = old.items.filter((i) => i.id !== tempItem.id);
          const idx = filtered.findIndex(
            (i) => i.variant_id === data.variant_id && i.size === data.size
          );
          if (idx >= 0) {
            filtered[idx] = data;
            return { items: filtered };
          }
          return { items: [data, ...filtered] };
        }
      );
    },
    onError: (error, _, context) => {
      const { previousData } = context as {
        previousData?: CartResponse;
        tempItem: CartItem;
      };

      if (previousData) {
        queryClient.setQueryData<CartResponse>(
          CART_QUERY_KEYS.cartList(session?.user?.id!),
          previousData
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
      return CartItemSchema.parse(item);
    },
    onMutate: async (params: { itemId: number; quantity: number }) => {
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const { itemId, quantity } = params;

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(session.user.id),
      });

      const previousData = queryClient.getQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id)
      );

      queryClient.setQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id),
        (current = { items: [] }) => {
          const next = [...current.items];
          const idx = next.findIndex((i) => i.id === itemId);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              quantity,
              updated_at: new Date().toISOString(),
            };
          }
          return { items: next };
        }
      );

      return { previousData };
    },
    onSuccess: (data, _, context) => {
      queryClient.setQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session?.user?.id!),
        (current = { items: [] }) => {
          const next = [...current.items];
          const idx = next.findIndex((i) => i.id === data.id);
          if (idx >= 0) next[idx] = data;
          return { items: next };
        }
      );
    },
    onError: (error, _, context) => {
      const { previousData } = context as { previousData?: CartResponse };

      if (previousData) {
        queryClient.setQueryData<CartResponse>(
          CART_QUERY_KEYS.cartList(session?.user?.id!),
          previousData
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
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const { itemId } = params;

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(session.user.id),
      });

      const previousData = queryClient.getQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id)
      );

      queryClient.setQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id),
        (current = { items: [] }) => ({
          items: current.items.filter((i) => i.id !== itemId),
        })
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      const { previousData } = context as { previousData?: CartResponse };

      if (previousData) {
        queryClient.setQueryData<CartResponse>(
          CART_QUERY_KEYS.cartList(session?.user?.id!),
          previousData
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
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      await queryClient.cancelQueries({
        queryKey: CART_QUERY_KEYS.cartList(session.user.id),
      });

      const previousData = queryClient.getQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id)
      );

      queryClient.setQueryData<CartResponse>(
        CART_QUERY_KEYS.cartList(session.user.id),
        { items: [] }
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      const { previousData } = context as { previousData?: CartResponse };

      if (previousData) {
        queryClient.setQueryData<CartResponse>(
          CART_QUERY_KEYS.cartList(session?.user?.id!),
          previousData
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
