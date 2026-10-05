"use client";

/** FUNCTIONALITY */
import { useThrottleFn } from "ahooks";
import { useCartMutation } from "@/hooks/cart";
import { RollingNumber } from "@/components/ui/rolling-number";
import { cn } from "@/lib/utils";
/** TYPES */
import type { CartItem } from "@/lib/db/drizzle/schema";

interface ProductCartInfoProps {
  cartItemId: CartItem["id"];
  quantity: CartItem["quantity"];
  productName: string;
  compact?: boolean;
}

/** − n + stepper. Going below one removes the line. */
export const ProductCartInfo = ({
  cartItemId,
  quantity,
  productName,
  compact = false,
}: ProductCartInfoProps) => {
  const { update: editQuantity, remove: removeFromCart } = useCartMutation();

  const { run: throttledIncrease } = useThrottleFn(
    () => {
      editQuantity({
        itemId: cartItemId,
        quantity: quantity + 1,
      });
    },
    {
      wait: 300,
    },
  );

  const { run: throttledDecrease } = useThrottleFn(
    () => {
      if (quantity > 1) {
        editQuantity({
          itemId: cartItemId,
          quantity: quantity - 1,
        });
      } else {
        removeFromCart({ itemId: cartItemId });
      }
    },
    {
      wait: 300,
    },
  );

  const step = cn(
    "grid place-items-center text-lg",
    compact ? "h-9 w-10 text-base" : "size-11",
  );

  return (
    <div className="flex items-center self-start rounded-pill border border-line">
      <button
        type="button"
        className={step}
        onClick={throttledDecrease}
        aria-label={`Remove one ${productName}`}
      >
        −
      </button>
      <span
        aria-live="polite"
        className={cn("text-center font-medium tabular-nums", compact ? "min-w-[18px] text-13" : "min-w-6")}
      >
        <span className="sr-only">Quantity </span>
        <RollingNumber value={quantity} />
      </span>
      <button
        type="button"
        className={step}
        onClick={throttledIncrease}
        aria-label={`Add one ${productName}`}
      >
        +
      </button>
    </div>
  );
};
