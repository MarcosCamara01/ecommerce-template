"use client";

import React, { useMemo } from "react";
import { Wishlists, delItem, addItem } from "@/app/(carts)/wishlist/action";
import { Schema } from "mongoose";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { useMutation } from "@tanstack/react-query";

interface WishlistButtonProps {
  productId: string;
  wishlistString: string;
}

const WishlistButton = ({
  productId,
  wishlistString,
}: WishlistButtonProps) => {
  const supabase = createClientComponentClient();

  const id: Schema.Types.ObjectId = useMemo(
    () => JSON.parse(productId),
    [productId]
  );

  const isFavorite = useMemo(() => {
    if (wishlistString) {
      const wishlist: Wishlists = JSON.parse(wishlistString);
      return wishlist.items.some(
        (wishlistProduct) =>
          wishlistProduct.productId.toString() === id.toString()
      );
    }
    return false;
  }, [wishlistString, id]);

  const { mutate: handleFavorites, isPending } = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("You must be registered to be able to add a product to the wishlist.");
      }

      if (isFavorite) {
        return delItem(id);
      } else {
        return addItem(id);
      }
    },
    onError: (error) => {
      toast.warning(error instanceof Error ? error.message : "An error occurred");
    }
  });

  return (
    <button
      onClick={() => handleFavorites()}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={isPending}
    >
      {isFavorite ? (
        <MdFavorite size={16} />
      ) : (
        <MdFavoriteBorder size={16} />
      )}
    </button>
  );
};

export default WishlistButton;
