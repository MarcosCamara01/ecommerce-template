"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";

const Wishlists = () => {
    const { userCart, cartLoading } = useCart();
    const [cartWithProducts, setCartWithProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true)
    const { status } = useSession();

    const fetchProducts = async (productId) => {
        try {
            const res = await fetch(`/api/products?_id=${productId}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
            }

            return res.json();
        } catch (error) {
            console.error("Error al obtener los productos:", error);
            return null;
        }
    };

    useEffect(() => {
        const updateCartWithProducts = async () => {
            if (userCart && userCart?.favorites) {
                const updatedCart = await Promise.all(userCart.favorites.map(async (productId) => {
                    const matchingProduct = await fetchProducts(productId);
                    if (matchingProduct) {
                        return {
                            ...matchingProduct,
                        };
                    }
                    return null;
                }));

                setCartWithProducts(updatedCart.reverse());
                setIsLoading(false);
            } else if (!cartLoading && userCart?.favorites.length === 0) {
                setIsLoading(false)
            } else if (!cartLoading && !userCart) {
                setIsLoading(false)
            }
        };

        updateCartWithProducts();
    }, [userCart, cartLoading]);

    return (
        <section>
            {isLoading ?
                <Loader />
                :
                cartWithProducts.length >= 1 ?
                    <>
                        <h2 className="section-h2">YOUR WISH LIST</h2>
                        <Products
                            products={cartWithProducts}
                        />
                    </>
                    :
                    <>
                        <h2>YOUR WISH LIST IS EMPTY</h2>
                        {
                            status === "authenticated" ?
                                <>
                                    <h3>When you have added something to the wish list, it will appear here. Want to get started?</h3>
                                    <Link href="/">Start</Link>
                                </>
                                :
                                <>
                                    <p>Not registered? You must be in order to save your favorite products.</p>
                                    <Link href="/login">Login</Link>
                                </>
                        }
                    </>
            }
        </section>
    );
}

export default Wishlists;