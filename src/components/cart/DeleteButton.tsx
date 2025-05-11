"use client";

/** ACTIONS */
import { removeCartItem } from "@/app/(carts)/cart/action";
/** FUNCTIONALITY */
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
/** ICONS */
import { IoClose } from "react-icons/io5";
/** TYPES */
import type { CartItem } from "@/schemas/ecommerce";

const DeleteButton = ({ cartItemId }: { cartItemId: CartItem["id"] }) => {
  const { user } = useUser();

  const { mutate: deleteItem, isPending } = useMutation({
    mutationFn: () => {
      if (!user) {
        throw new Error("User not found");
      }

      return removeCartItem(cartItemId);
    },
    onError: (error) => {
      console.error("Error removing item from cart", error);
      toast.error("Error removing item from cart");
    },
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
