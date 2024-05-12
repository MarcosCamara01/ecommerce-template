"use server";

import { connectDB } from "@/libs/mongodb";
import { Product } from "@/models/Products";
import { EnrichedProducts } from "@/types/types";

export const getAllProducts = async () => {
  try {
    await connectDB();

    const products: EnrichedProducts[] = await Product.find();
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    throw new Error("Failed to fetch category products");
  }
};

export const getCategoryProducts = async (category: string) => {
  try {
    await connectDB();

    const products: EnrichedProducts[] = await Product.find({ category });
    return products;
  } catch (error) {
    console.error("Error getting products:", error);
    throw new Error("Failed to fetch category products");
  }
};

export const getRandomProducts = async (productId: string) => {
  const shuffleArray = (array: EnrichedProducts[]) => {
    let shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  try {
    await connectDB();

    const allProducts: EnrichedProducts[] = await Product.find();
    const shuffledProducts = shuffleArray(allProducts);
    const randomProducts = shuffledProducts
      .filter((product) => product._id.toString() !== productId)
      .slice(0, 6);
    return randomProducts;
  } catch (error) {
    console.error("Error getting products:", error);
    throw new Error("Failed to fetch random products");
  }
};

export const getProduct = async (_id: string) => {
  try {
    await connectDB();

    const product = await Product.findOne({ _id });
    return product;
  } catch (error) {
    console.error("Error getting product:", error);
  }
};
