"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CART_QUERY_KEYS } from "@/hooks/cart";
import { useSession } from "@/lib/auth/client";
import type { CartCleanupOutcome } from "@/lib/order-fulfillment";

export function FulfilledCheckoutSync({
  cartCleanup,
}: {
  cartCleanup: CartCleanupOutcome;
}) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.cartList(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: CART_QUERY_KEYS.cartDetails(userId),
      }),
    ]);
  }, [cartCleanup, queryClient, userId]);

  return null;
}
