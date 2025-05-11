"use client";
/** ACTIONS */
import {
  addCartItem,
  editCartItem,
  removeCartItem,
} from "@/app/(carts)/cart/action";
/** FUNCTIONALITY */
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
/** ICONS */
import { IoAdd, IoRemove } from "react-icons/io5";
/** TYPES */
import type { EnrichedProduct } from "@/schemas/ecommerce";

const ProductCartInfo = ({ product }: { product: EnrichedProduct }) => {
  const { cart_item, price } = product;

  const variantId = cart_item?.variant_id!;
  const size = cart_item?.size!;
  const quantity = cart_item?.quantity!;
  const purchased = false;

  const { mutate: addToCart, isPending: isAddPending } = useMutation({
    mutationFn: async () =>
      await addCartItem({
        variant_id: variantId,
        size: size,
      }),
    onError: (error) => {
      toast.error("Error adding item to cart");
    },
  });

  const { mutate: removeFromCart, isPending: isRemovePending } = useMutation({
    mutationFn: async () => {
      if (!cart_item) return;

      if (quantity > 1) {
        return await editCartItem({
          id: cart_item.id,
          quantity: quantity - 1,
        });
      } else {
        return await removeCartItem(cart_item.id);
      }
    },
    onError: (error) => {
      toast.error("Error removing item from cart");
    },
  });

  return (
    <>
      <div className="flex sm:hidden">
        <div className="text-sm pr-2.5 border-r">{size}</div>
      </div>
      <div className="flex items-center justify-between sm:hidden">
        {purchased ? (
          <div className="text-sm">{price.toFixed(2)}€</div>
        ) : (
          <div className="flex bg-black w-min">
            <button
              className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l text-[#A1A1A1] transition-all hover:text-white border-border-primary disabled:opacity-50"
              onClick={() => removeFromCart()}
              disabled={isRemovePending}
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
              className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r text-[#A1A1A1] transition-all hover:text-white border-border-primary disabled:opacity-50"
              onClick={() => addToCart()}
              disabled={isAddPending}
              aria-label="Increase quantity"
            >
              <IoAdd className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="items-center justify-between hidden sm:flex">
        {purchased ? (
          <div className="text-sm">{price.toFixed(2)}€</div>
        ) : (
          <div className="flex bg-black w-min">
            <button
              className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l text-[#A1A1A1] transition-all hover:text-white border-border-primary disabled:opacity-50"
              onClick={() => removeFromCart()}
              disabled={isRemovePending}
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
              className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r text-[#A1A1A1] transition-all hover:text-white border-border-primary disabled:opacity-50"
              onClick={() => addToCart()}
              disabled={isAddPending}
              aria-label="Increase quantity"
            >
              <IoAdd className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex">
          <div className="text-sm pr-2.5 border-r">{size}</div>
        </div>
      </div>
    </>
  );
};

export default ProductCartInfo;
