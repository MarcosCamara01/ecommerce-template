"use client";

/** FUNCTIONALITY */
import { useWishlist } from "@/hooks/wishlist";
import { useThrottleFn } from "ahooks";
/** ICONS */
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
/** COMPONENTS */
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
/** TYPES */
import type { ProductWithVariants } from "@/schemas";
import { useWishlistMutation } from "@/hooks/wishlist/mutations/useWishlistMutation";

interface WishlistButtonProps {
  productId: ProductWithVariants["id"];
}

const WishlistButton = ({ productId }: WishlistButtonProps) => {
  const { isInWishlist, isLoading } = useWishlist();
  const { remove: removeFromWishlist, add: addToWishlist } =
    useWishlistMutation();

  const isFavorite = isInWishlist(productId);

  const { run: throttledToggle } = useThrottleFn(
    () => {
      if (isFavorite) {
        removeFromWishlist({ productId });
      } else {
        addToWishlist(productId);
      }
    },
    {
      wait: 300,
    }
  );

  if (isLoading) {
    return (
      <div className="p-2">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    );
  }

  return (
    <Button
      onClick={throttledToggle}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className="text-color-tertiary hover:bg-background-tertiary"
      variant="ghost"
      size="xs"
    >
      {isFavorite ? <MdFavorite size={16} /> : <MdFavoriteBorder size={16} />}
    </Button>
  );
};

export default WishlistButton;
