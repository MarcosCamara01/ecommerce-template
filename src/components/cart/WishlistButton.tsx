"use client";

import React, { useMemo, useCallback } from "react";
import { Wishlists, delItem, addItem } from "@/app/(carts)/wishlist/action";
import { Schema } from "mongoose";
import { Session } from "next-auth";
import { toast } from "sonner";

interface WishlistButtonProps {
  session: Session | null;
  productId: string;
  wishlistString: string;
}

const WishlistButton = ({
  session,
  productId,
  wishlistString,
}: WishlistButtonProps) => {
  const id: Schema.Types.ObjectId = useMemo(
    () => JSON.parse(productId),
    [productId]
  );

  const isFavorite = useMemo(() => {
    if (session?.user && wishlistString) {
      const wishlist: Wishlists = JSON.parse(wishlistString);
      return wishlist.items.some(
        (wishlistProduct) =>
          wishlistProduct.productId.toString() === id.toString()
      );
    }
    return false;
  }, [session, wishlistString, id]);

  const handleFavorites = useCallback(async () => {
    if (session?.user?._id) {
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
  }, [session, isFavorite, id]);

  return (
    <button
      onClick={handleFavorites}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? (
        <svg
          data-testid="geist-icon"
          height="16"
          strokeLinejoin="round"
          viewBox="0 0 16 16"
          width="16"
          style={{ color: "currentColor" }}
        >
          <path
            d="M1.39408 2.14408C3.21165 0.326509 6.13348 0.286219 8 2.02321C9.86652 0.286221 12.7884 0.326509 14.6059 2.14408C16.4647 4.00286 16.4647 7.01653 14.6059 8.87531L8 15.4812L1.39408 8.87531C-0.464691 7.01653 -0.464694 4.00286 1.39408 2.14408Z"
            fill="currentColor"
          ></path>
        </svg>
      ) : (
        <svg
          data-testid="geist-icon"
          height="16"
          strokeLinejoin="round"
          viewBox="0 0 16 16"
          width="16"
          style={{ color: "currentColor" }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.06463 3.20474C5.79164 1.93175 3.72772 1.93175 2.45474 3.20474C1.18175 4.47773 1.18175 6.54166 2.45474 7.81465L8 13.3599L13.5453 7.81465C14.8182 6.54166 14.8182 4.47773 13.5453 3.20474C12.2723 1.93175 10.2084 1.93175 8.93537 3.20474L8.53033 3.60979L8 4.14012L7.46967 3.60979L7.06463 3.20474ZM8 2.02321C6.13348 0.286219 3.21165 0.326509 1.39408 2.14408C-0.464694 4.00286 -0.464691 7.01653 1.39408 8.87531L7.46967 14.9509L8 15.4812L8.53033 14.9509L14.6059 8.87531C16.4647 7.01653 16.4647 4.00286 14.6059 2.14408C12.7884 0.326509 9.86653 0.286221 8 2.02321Z"
            fill="currentColor"
          ></path>
        </svg>
      )}
    </button>
  );
};

export default WishlistButton;
