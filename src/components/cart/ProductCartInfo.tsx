"use client";

import { useCallback } from "react";
import { EnrichedProducts } from "@/types/types";
import { addItem, delOneItem } from "@/app/(carts)/cart/action";
import { useMutation } from "@tanstack/react-query";
import { IoAdd, IoRemove } from "react-icons/io5";
import { toast } from "sonner";

const ProductCartInfo = ({ product }: { product: EnrichedProducts }) => {
  const {
    productId,
    size,
    variantId,
    category,
    price,
    quantity,
    purchased,
    color,
  } = product;

  const { mutate: addToCart, isPending: isAddPending } = useMutation({
    mutationFn: () => addItem(category, productId, size, variantId, price),
    onError: (error) => {
      toast.error("Error adding item to cart");
    }
  });

  const { mutate: removeFromCart, isPending: isRemovePending } = useMutation({
    mutationFn: () => delOneItem(productId, size, variantId),
    onError: (error) => {
      toast.error("Error removing item from cart");
    }
  });

  const quantityButtons = useCallback(() => {
    if (purchased) {
      return (
        <div className="text-sm">
          {quantity ? (price * quantity).toFixed(2) : price}€
        </div>
      );
    } else {
      return (
        <div className="flex bg-black w-min">
          <button
            className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l text-[#A1A1A1] transition-all hover:text-white border-border-primary disabled:opacity-50"
            onClick={() => removeFromCart()}
            disabled={isRemovePending}
          >
            <IoRemove className="w-4 h-4" />
          </button>
          <span className="flex items-center justify-center w-8 h-8 p-2 text-sm border-solid border-y border-border-primary">
            {quantity}
          </span>
          <button
            className="flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r text-[#A1A1A1] transition-all hover:text-white border-border-primary disabled:opacity-50"
            onClick={() => addToCart()}
            disabled={isAddPending}
          >
            <IoAdd className="w-4 h-4" />
          </button>
        </div>
      );
    }
  }, [purchased, quantity, price, addToCart, removeFromCart, isAddPending, isRemovePending]);

  return (
    <>
      <div className="flex sm:hidden">
        <div className="text-sm pr-2.5 border-r">{size}</div>
        <div className="text-sm pl-2.5">{color}</div>
      </div>
      <div className="flex items-center justify-between sm:hidden">
        {quantityButtons()}
      </div>
      <div className="items-center justify-between hidden sm:flex">
        {quantityButtons()}
        <div className="flex">
          <div className="text-sm pr-2.5 border-r">{size}</div>
          <div className="text-sm pl-2.5">{color}</div>
        </div>
      </div>
    </>
  );
};

export default ProductCartInfo;
