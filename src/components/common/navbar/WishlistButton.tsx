"use client";

/** FUNCTIONALITY */
import { useWishlist } from "@/hooks/wishlist";
/** COMPONENTS */
import Link from "next/link";
/** ICONS */
import { MdFavorite } from "react-icons/md";

export const WishlistButton = () => {
  const { items: wishlistProducts } = useWishlist();

  return (
    <Link
      href="/wishlist"
      aria-label="Products saved in wishlist"
      className="text-sm py-3 px-3 rounded-md transition-all text-[#EDEDED] hover:bg-[#1F1F1F] relative"
    >
      <MdFavorite size={18} />
      <span className="flex text-xs items-center bg-[#0072F5] font-medium text-[#EDEDED] justify-center absolute size-5 rounded-full top-[-3px] right-[-3px]">
        {wishlistProducts.length || 0}
      </span>
    </Link>
  );
};
