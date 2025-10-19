"use client";

/** FUNCTIONALITY */
import { useCart } from "@/hooks/cart";
/** COMPONENTS */
import Link from "next/link";
/** ICONS */
import { FiShoppingCart } from "react-icons/fi";

export const CartButton = () => {
  const { items: cartProducts } = useCart();

  const totalItemsCart = cartProducts.reduce(
    (acc, cartItem) => acc + cartItem.quantity,
    0
  );

  return (
    <Link
      href="/cart"
      aria-label="Products saved in the shopping cart"
      className="text-sm py-3 px-3 rounded-md transition-all text-[#EDEDED] hover:bg-[#1F1F1F] relative"
    >
      <FiShoppingCart size={16} />
      <span className="flex text-xs size-5 items-center bg-[#0072F5] font-medium text-[#EDEDED] justify-center absolute rounded-full top-[-3px] right-[-3px]">
        {totalItemsCart || 0}
      </span>
    </Link>
  );
};
