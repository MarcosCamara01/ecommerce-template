"use client";

import React, { useMemo, useCallback } from "react";
import { Wishlists, delItem, addItem } from "@/app/(carts)/wishlist/action";
import { Schema } from "mongoose";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";

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

  const handleFavorites = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      if (isFavorite) {
        await delItem(id);
      } else {
        await addItem(id);
      }
    } else {
      const warningMessage =
        "You must be registered to be able to add a product to the wishlist.";
      console.warn(warningMessage);
      toast.warning(warningMessage);
    }
  }, [supabase, isFavorite, id]);

  return (
    <button
      onClick={handleFavorites}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
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
