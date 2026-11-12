"use client";

import type { CartItem } from "@/lib/db/drizzle/schema";
import { useCartMutation } from "@/hooks/cart";

/** Removes the line at once; the mutation reports failures in a toast. */
export const DeleteButton = ({
  cartItemId,
  productName,
}: {
  cartItemId: CartItem["id"];
  productName: string;
}) => {
  const { remove: removeFromCart } = useCartMutation();

  return (
    <button
      type="button"
      onClick={() => removeFromCart({ itemId: cartItemId })}
      aria-label={`Remove ${productName} from bag`}
      className="h-11 px-3 text-sm underline underline-offset-[3px]"
    >
      Remove
    </button>
  );
};
