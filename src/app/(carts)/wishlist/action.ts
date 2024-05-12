"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { Session } from "next-auth";
import mongoose, { Schema } from "mongoose";
import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";
import { Product } from "@/models/Products";
import { connectDB } from "@/libs/mongodb";

export type Wishlists = {
  userId: string;
  items: Array<{
    productId: Schema.Types.ObjectId;
  }>;
};

export async function addItem(productId: Schema.Types.ObjectId) {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user._id) {
    console.error(`User Id not found.`);
    return;
  }

  const userId = session.user._id;
  let wishlists: Wishlists | null = await kv.get(`wishlist-${userId}`);

  let myWishlists = {} as Wishlists;

  if (!wishlists || !wishlists.items) {
    myWishlists = {
      userId: userId,
      items: [
        {
          productId: productId,
        },
      ],
    };
  } else {
    let itemFound = false;

    myWishlists.items = wishlists.items.map((item) => {
      if (item.productId === productId) {
        itemFound = true;
      }
      return item;
    }) as Wishlists["items"];

    if (!itemFound) {
      myWishlists.items.push({
        productId: productId,
      });
    }
  }

  await kv.set(`wishlist-${userId}`, myWishlists);
  revalidatePath("/wishlist");
}

export async function getItems(userId: string) {
  connectDB();

  if (!userId) {
    console.error(`User Id not found.`);
    return null;
  }

  const wishlist: Wishlists | null = await kv.get(`wishlist-${userId}`);

  if (wishlist === null) {
    console.error("wishlist not found.");
    return null;
  }

  const updatedWishlist = [];
  for (const wishlistItem of wishlist.items) {
    try {
      if (wishlistItem.productId) {
        const matchingProduct = await Product.findById(wishlistItem.productId);

        if (!matchingProduct) {
          console.error(
            `Product not found for productId: ${wishlistItem.productId}`,
          );
          continue;
        } else {
          updatedWishlist.push(matchingProduct);
        }
      }
    } catch (error) {
      console.error("Error getting product details:", error);
    }
  }

  const filteredWishlist = updatedWishlist.filter((item) => item !== null);

  return filteredWishlist;
}

export async function getTotalWishlist() {
  const session: Session | null = await getServerSession(authOptions);
  const wishlists: Wishlists | null = await kv.get(
    `wishlist-${session?.user._id}`,
  );

  if (wishlists === null) {
    return undefined;
  }

  return wishlists;
}

export async function delItem(productId: Schema.Types.ObjectId) {
  const session: Session | null = await getServerSession(authOptions);
  const userId = session?.user._id;

  if (!userId) {
    console.error("User not found.");
    return;
  }

  let wishlists: Wishlists | null = await kv.get(`wishlist-${userId}`);

  if (wishlists && wishlists.items) {
    const updatedWishlist = {
      userId: userId,
      items: wishlists.items.filter((item) => !(item.productId === productId)),
    };

    await kv.set(`wishlist-${userId}`, updatedWishlist);
    revalidatePath("/wishlist");
  }
}
