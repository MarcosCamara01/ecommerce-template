"use client";

import { toast } from "sonner";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { toggleWishlistItem } from "@/app/(carts)/wishlist/action";

interface WishlistButtonProps {
  productId: number;
  isFavorite: boolean;
}

const WishlistButton = ({ productId, isFavorite }: WishlistButtonProps) => {
  const { user } = useUser();

  const {
    mutate: handleFavorites,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error(
          "You must be registered to be able to add a product to the wishlist."
        );
      }

      await toggleWishlistItem(productId);
    },
    onError: (error) => {
      console.error("Error toggling wishlist item:", error);
      toast.warning(
        error instanceof Error ? error.message : "An error occurred"
      );
    },
  });

  return (
    <button
      onClick={() => handleFavorites()}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={isPending}
      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
    >
      {isFavorite ? (
        <MdFavorite size={16} className="text-red-500" />
      ) : (
        <MdFavoriteBorder size={16} />
      )}
    </button>
  );
};

export default WishlistButton;
