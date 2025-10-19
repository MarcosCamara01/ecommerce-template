"use client";

/** FUNCTIONALITY */
import { useWishlist } from "@/hooks/wishlist";
/** ICONS */
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
/** COMPONENTS */
import { Skeleton } from "@/components/ui/skeleton";
/** TYPES */
import type { ProductWithVariants } from "@/schemas/ecommerce";
import { Button } from "../ui/button";
import { useWishlistMutation } from "@/hooks/wishlist/mutations/useWishlistMutation";

interface WishlistButtonProps {
  productId: ProductWithVariants["id"];
}

const WishlistButton = ({ productId }: WishlistButtonProps) => {
  const { isInWishlist, isLoading } = useWishlist();
  const { remove: removeFromWishlist, add: addToWishlist } =
    useWishlistMutation();

  const isFavorite = isInWishlist(productId);

  const handleToggle = () => {
    if (isFavorite) {
      removeFromWishlist({ productId });
    } else {
      addToWishlist(productId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-2">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      variant="ghost"
      size="xs"
    >
      {isFavorite ? <MdFavorite size={16} /> : <MdFavoriteBorder size={16} />}
    </Button>
  );
};

export default WishlistButton;
