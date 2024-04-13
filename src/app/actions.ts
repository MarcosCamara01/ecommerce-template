"use server";

import { connectDB } from "@/libs/mongodb";
import { Product } from "@/models/Products";
import { ProductDocument } from "@/types/types";

connectDB();

export const getAllProducts = async () => {
    try {
        const products: ProductDocument[] = await Product.find();
        return products;
    } catch (error) {
        console.error('Error getting products:', error);
    }
}

export const getCategoryProducts = async (category: string) => {
    try {
        const products: ProductDocument[] = await Product.find({ category });
        return products;
    } catch (error) {
        console.error('Error getting products:', error);
    }
}

export const getRandomProducts = async (productId: string) => {
    const shuffleArray = (array: ProductDocument[]) => {
        let shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    try {
        const allProducts: ProductDocument[] = await Product.find();
        const shuffledProducts = shuffleArray(allProducts);
        const randomProducts = shuffledProducts
            .filter(product => product._id.toString() !== productId)
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