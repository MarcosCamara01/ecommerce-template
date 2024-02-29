"use server";

import axios from "axios";

import { serverSession } from "./serverSession";

export const fetchUserCart = async () => {
    try {
        const session = await serverSession();
        const userId = session?.user._id;

        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/cart?userId=${userId}`
        );

        const userCart = response.data;
        return userCart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};