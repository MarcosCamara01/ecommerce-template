"use client";

/** FUNCTIONALITY */
import { useWishlist } from "@/hooks/wishlist";
/** COMPONENTS */
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
/** ICONS */
import { MdFavorite } from "react-icons/md";

export const WishlistLink = () => {
  const { items: wishlistProducts, isFetching } = useWishlist();

  if (isFetching) {
    return <Skeleton className="size-10 rounded-md" />;
  }

  return (
    <Link
      href="/wishlist"
      aria-label="Products saved in wishlist"
      className="text-sm py-3 px-3 rounded-md transition-all text-color-tertiary hover:bg-background-tertiary relative"
    >
      <MdFavorite size={18} />
      <span className="flex text-xs items-center bg-[#0072F5] font-medium text-color-tertiary justify-center absolute size-5 rounded-full top-[-3px] right-[-3px]">
        {wishlistProducts.length || 0}
      </span>
    </Link>
  );
};
