"use server";

import { connectDB } from "@/libs/mongodb";
import { Product } from "@/models/Products";

connectDB();

export const getAllProducts = async () => {
    try {
        const products = await Product.find();
        return products;
    } catch (error) {
        console.error('Error getting products:', error);
    }
}

export const getCategoryProducts = async (category: string) => {
    try {
        const products = await Product.find({ category });
        return products;
    } catch (error) {
        console.error('Error getting products:', error);
    }
}

export const getRandomProducts = async (productId: string) => {
    const shuffleArray = (array: any) => {
        let shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    try {
        const allProducts = await Product.find();
        const shuffledProducts = shuffleArray(allProducts);
        const randomProducts = shuffledProducts
            .filter((product: any) => product._id.toString() !== productId)
            .slice(0, 6);
        return randomProducts;
    } catch (error) {
        console.error('Error getting products:', error);
    }
}

export const getProduct = async (_id: string) => {
    try {
        const product = await Product.findOne({ _id });
        return product;
    } catch (error) {
        console.error('Error getting product:', error);
    }
}