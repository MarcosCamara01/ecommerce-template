"use client";

import { useMutation } from "@tanstack/react-query";
import { delItem } from "@/app/(carts)/cart/action";
import { EnrichedProducts } from "@/types/types";
import { toast } from "sonner";
import { IoClose } from "react-icons/io5";

const DeleteButton = ({ product }: { product: EnrichedProducts }) => {
  const { productId, size, variantId } = product;

  const { mutate: deleteItem, isPending } = useMutation({
    mutationFn: () => delItem(productId, size, variantId),
    onError: (error) => {
      toast.error("Error removing item from cart");
    }
  });

  return (
    <button
      onClick={() => deleteItem()}
      disabled={isPending}
      aria-label="Delete item"
      className="transition-all hover:text-white disabled:opacity-50"
    >
      <IoClose className="w-[18px] h-[18px] text-[#A1A1A1]" />
    </button>
  );
};

export default DeleteButton;
