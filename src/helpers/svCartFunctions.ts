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

export const createCart = async (updatedCart: any[], userId: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cart: updatedCart,
                userId: userId
            })
        });
        const data = response.json();
        return data;
    } catch (error) {
        console.error('Error saving in cart:', error);
        return null;
    }
};

export const saveCart = async (updatedCart: any[], id: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart?id=${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cart: updatedCart,
            })
        });

        const data = response.json();
        return data;
    } catch (error) {
        console.error('Error saving in cart:', error);
        return null;
    }
};