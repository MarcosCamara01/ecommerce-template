"use server";

import { createSSRClient } from "@/libs/supabase/server";
import type { EnrichedProduct } from "@/schemas/ecommerce";
import { productsWithVariantsQuery } from "@/schemas/ecommerce";
import { unstable_cache } from "next/cache";
import { getWishlistItems } from "@/app/(carts)/wishlist/action";
import { getCartItems } from "@/app/(carts)/cart/action";
import { getUser } from "@/libs/supabase/auth/getUser";

export const getAllProducts = unstable_cache(
  async (): Promise<EnrichedProduct[]> => {
    try {
      const supabase = createSSRClient();
      const { data: products, error } = await supabase
        .from("products_items")
        .select(productsWithVariantsQuery);

      if (error) throw error;

      const user = await getUser();
      if (!user) {
        return products as EnrichedProduct[];
      }

      const wishlistItems = await getWishlistItems();

      const enrichedProducts = (products as EnrichedProduct[]).map(
        (product) => ({
          ...product,
          wishlist_item: wishlistItems?.find(
            (item) => item.product_id === product.id
          ),
        })
      );

      return enrichedProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }
  },
  ["all-products"],
  { revalidate: 3600 }
);

export const getCartProducts = unstable_cache(
  async (): Promise<EnrichedProduct[]> => {
    try {
      const user = await getUser();
      if (!user) return [];

      const allProducts = await getAllProducts();
      const cartItems = await getCartItems();

      if (!cartItems?.length) return [];

      const variantIds = cartItems.map((item) => item.variant_id);

      const cartProducts = allProducts
        .filter((product) =>
          product.variants.some((variant) => variantIds.includes(variant.id))
        )
        .map((product) => {
          const cartItem = cartItems.find((item) =>
            product.variants.some((variant) => variant.id === item.variant_id)
          );
          const variant = product.variants.find(
            (v) => v.id === cartItem?.variant_id
          );

          return {
            ...product,
            img: variant?.images[0] || product.img,
            cart_item: cartItem,
          };
        });

      return cartProducts;
    } catch (error) {
      console.error("Error fetching cart products:", error);
      throw new Error("Error fetching cart products");
    }
  },
  ["cart-products"],
  { revalidate: 3600 }
);

export const getCategoryProducts = unstable_cache(
  async (category: string): Promise<EnrichedProduct[]> => {
    try {
      const supabase = createSSRClient();
      const { data: products, error } = await supabase
        .from("products_items")
        .select(productsWithVariantsQuery)
        .eq("category", category);

      if (error) throw error;

      return products as EnrichedProduct[];
    } catch (error) {
      console.error("Error fetching category products:", error);
      throw new Error("Error fetching category products");
    }
  },
  // cache key + category argument from function
  ["category-products"],
  { revalidate: 3600 }
);

export const getRandomProducts = unstable_cache(
  async (productId: number): Promise<EnrichedProduct[]> => {
    try {
      const supabase = createSSRClient();

      const { data: randomProducts, error } = await supabase
        .from("products_items")
        .select(productsWithVariantsQuery)
        .neq("id", productId)
        .order("random()")
        .limit(6);

      if (error) throw error;

      return randomProducts as EnrichedProduct[];
    } catch (error) {
      console.error("Error fetching random products:", error);
      throw new Error("Error fetching random products");
    }
  },
  ["random-products"],
  { revalidate: 3600 }
);

export const getProduct = unstable_cache(
  async (productId: number): Promise<EnrichedProduct | null> => {
    try {
      const supabase = createSSRClient();

      const { data, error } = await supabase
        .from("products_items")
        .select(productsWithVariantsQuery)
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;

      return data as EnrichedProduct | null;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw new Error("Error fetching product");
    }
  },
  ["product"],
  { revalidate: 3600 }
);
