"use client";

/** FUNCTIONALITY */
import { useThrottleFn } from "ahooks";
import { useCartMutation } from "@/hooks/cart";
/** ICONS */
import { IoAdd, IoRemove } from "react-icons/io5";
/** TYPES */
import type { ProductVariant, CartItem } from "@/schemas/ecommerce";

interface ProductCartInfoProps {
  cartItemId: CartItem["id"];
  size: CartItem["size"];
  quantity: CartItem["quantity"];
  color: ProductVariant["color"];
}

export const ProductCartInfo = ({
  cartItemId,
  size,
  quantity,
  color,
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
    }
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
    }
  );

  return (
    <>
      <div className="flex sm:hidden">
        <div className="text-sm pr-2.5 border-r">{size}</div>
        <div className="text-sm pl-2.5">{color}</div>
      </div>
      <div className="flex items-center justify-between sm:hidden">
        <div className="flex bg-black w-min">
          <button
            className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l text-color-secondary transition-all hover:text-white border-border-primary disabled:opacity-50"
            onClick={throttledDecrease}
            disabled={false}
            aria-label="Decrease quantity"
          >
            <IoRemove className="w-4 h-4" />
          </button>
          <span
            className="flex items-center justify-center w-8 h-8 p-2 text-sm border-solid border-y border-border-primary"
            aria-label={`Current quantity: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r text-color-secondary transition-all hover:text-white border-border-primary disabled:opacity-50"
            onClick={throttledIncrease}
            disabled={false}
            aria-label="Increase quantity"
          >
            <IoAdd className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="items-center justify-between hidden sm:flex">
        <div className="flex bg-black w-min">
          <button
            className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l text-color-secondary transition-all hover:text-white border-border-primary disabled:opacity-50"
            onClick={throttledDecrease}
            disabled={false}
            aria-label="Decrease quantity"
          >
            <IoRemove className="w-4 h-4" />
          </button>
          <span
            className="flex items-center justify-center w-8 h-8 p-2 text-sm border-solid border-y border-border-primary"
            aria-label={`Current quantity: ${quantity}`}
          >
            {quantity}
          </span>
          <button
            className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r text-color-secondary transition-all hover:text-white border-border-primary disabled:opacity-50"
            onClick={throttledIncrease}
            disabled={false}
            aria-label="Increase quantity"
          >
            <IoAdd className="w-4 h-4" />
          </button>
        </div>
        <div className="flex">
          <div className="text-sm pr-2.5 border-r">{size}</div>
          <div className="text-sm pl-2.5">{color}</div>
        </div>
      </div>
    </>
  );
};
