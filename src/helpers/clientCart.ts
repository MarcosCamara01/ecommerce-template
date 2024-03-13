"use client";

import { getProducts } from "./getProducts";
import { CartDocument } from "@/types/types";

export const productsWislists = async (
  userCart: CartDocument,
  cartLoading: boolean,
  setCartWithProducts: any,
  setIsLoading: any
) => {
  if (userCart && userCart?.favorites) {
    const updatedCart = await Promise.all(userCart.favorites.map(async (productId: any) => {
      const matchingProduct = await getProducts(`?_id=${productId}`);
      if (matchingProduct) {
        return {
          ...matchingProduct,
        };
      }
      return null;
    }));

    setCartWithProducts(updatedCart.reverse());
    setIsLoading(false);
  } else if (!cartLoading && userCart?.favorites) {
    setIsLoading(false)
  } else if (!cartLoading && !userCart) {
    setIsLoading(false)
  }
};
