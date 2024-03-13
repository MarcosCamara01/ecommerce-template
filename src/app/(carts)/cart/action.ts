'use server'

import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";
import { Schema } from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { Session } from "next-auth";
import { Product } from "@/models/Products";
import { VariantsDocument } from "@/types/types";

export type Cart = {
    userId: string;
    items: Array<{
        productId: Schema.Types.ObjectId;
        size: string;
        variantId: string;
        quantity: number;
        price: number;
    }>
}

export async function getItems(session: Session) {
    if (!session?.user._id) {
        console.error(`User Id not found.`);
        return null;
    }

    const userId = session.user._id;
    const cart: Cart | null = await kv.get(`cart-${userId}`);

    if (cart == null) {
        console.error("Products or cart not found.");
        return null;
    }

    const updatedCart = [];
    for (const cartItem of cart.items) {
        try {
            if (cartItem.productId && cartItem.variantId) {
                const matchingProduct = await Product.findById(cartItem.productId);

                if (!matchingProduct) {
                    console.error(`Product not found for productId: ${cartItem.productId}`);
                    continue;
                } else {
                    const matchingVariant = matchingProduct.variants.find(
                        (variant: VariantsDocument) => variant.priceId === cartItem.variantId
                    );
                    const updatedCartItem = {
                        ...cartItem,
                        color: matchingVariant.color,
                        category: matchingProduct.category,
                        image: [matchingVariant.images[0]],
                        name: matchingProduct.name,
                        purchased: false,
                        _id: matchingProduct._id.toString()
                    };

                    updatedCart.push(updatedCartItem);
                }
            }
        } catch (error) {
            console.error("Error getting product details:", error);
        }
    }

    const filteredCart = updatedCart.filter(item => item !== null);

    return filteredCart;
}

export async function getTotalItems() {
    const session: Session | null = await getServerSession(authOptions);
    const userId = session?.user._id;
    const cart: Cart | null = await kv.get(`cart-${userId}`);
    const total: number = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return total;
}

export async function addItem(
    productId: Schema.Types.ObjectId,
    size: string,
    variantId: string,
    price: number
) {
    const session: Session | null = await getServerSession(authOptions);

    if (!session?.user._id) {
        console.error(`User Id not found.`);
        return;
    }

    const userId = session.user._id
    let cart: Cart | null = await kv.get(`cart-${userId}`);

    let myCart = {} as Cart;

    if (!cart || !cart.items) {
        myCart = {
            userId: userId,
            items: [
                {
                    productId: productId,
                    size: size,
                    variantId: variantId,
                    quantity: 1,
                    price: price,
                }
            ]
        };
    } else {
        let itemFound = false;

        myCart.items = cart.items.map(item => {
            if (item.productId === productId && item.variantId === variantId && item.size === size) {
                itemFound = true;
                item.quantity += 1;
            }
            return item;
        }) as Cart['items'];

        if (!itemFound) {
            myCart.items.push({
                productId: productId,
                size: size,
                variantId: variantId,
                quantity: 1,
                price: price,
            });
        }
    }

    await kv.set(`cart-${userId}`, myCart);
    revalidatePath('/cart');
}

export async function delItem(
    productId: Schema.Types.ObjectId,
    size: string,
    variantId: string
) {
    const session: Session | null = await getServerSession(authOptions);
    const userId = session?.user._id;
    let cart: Cart | null = await kv.get(`cart-${userId}`);

    if (cart && cart.items) {
        const updatedCart = {
            userId: userId,
            items: cart.items.filter(item => !(item.productId === productId && item.variantId === variantId && item.size === size)),
        };

        await kv.set(`cart-${userId}`, updatedCart);
        revalidatePath('/cart');
    }
}

export async function delOneItem(
    productId: Schema.Types.ObjectId,
    size: string,
    variantId: string
) {
    try {
        const session: Session | null = await getServerSession(authOptions);
        const userId = session?.user._id;
        let cart: Cart | null = await kv.get(`cart-${userId}`);

        if (cart && cart.items) {
            const updatedCart = {
                userId: userId,
                items: cart.items.map(item => {
                    if (item.productId === productId && item.variantId === variantId && item.size === size) {
                        if (item.quantity > 1) {
                            item.quantity -= 1;
                        } else {
                            return null;
                        }
                    }
                    return item;
                }).filter(Boolean) as Cart['items'],
            };

            await kv.set(`cart-${userId}`, updatedCart);
            revalidatePath('/cart');
        }
    } catch (error) {
        console.error('Error in delOneItem:', error);
    }
}
