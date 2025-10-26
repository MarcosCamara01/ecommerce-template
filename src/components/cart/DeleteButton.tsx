"use client";

import { toast } from "sonner";
import { IoClose } from "react-icons/io5";
import type { CartItem } from "@/schemas/ecommerce";
import { useCartMutation } from "@/hooks/cart";

const DeleteButton = ({ cartItemId }: { cartItemId: CartItem["id"] }) => {
  const { remove: removeFromCart } = useCartMutation();

  const handleDelete = async () => {
    try {
      removeFromCart({ itemId: cartItemId });
    } catch (error) {
      console.error("Error removing item from cart", error);
      toast.error("Error removing item from cart");
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={false}
      aria-label="Delete item"
      className="transition-all hover:text-white disabled:opacity-50"
    >
      <IoClose className="w-[18px] h-[18px] text-color-secondary" />
    </button>
  );
};

export default DeleteButton;
