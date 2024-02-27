"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/products/Products";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/components/Loader";
import { productsWislists } from "@/helpers/clientCart";

const Wishlists = () => {
    const { userCart, cartLoading } = useCart();
    const [cartWithProducts, setCartWithProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true)
    const { status } = useSession();

    useEffect(() => {
        productsWislists(userCart, cartLoading, setCartWithProducts, setIsLoading);
    }, [userCart, cartLoading]);

    useEffect(() => {
        document.title = "Wishlist | Ecommerce Template"
    }, [])

    return (
        <section className="pt-12">
            {isLoading ?
                <Loader />
                :
                cartWithProducts.length >= 1 ?
                    <>
                        <h2 className="text-xl sm:text-2xl font-bold mb-5">YOUR WISHLISTS</h2>
                        <Products
                            products={cartWithProducts}
                            extraClassname={"colums-mobile"}
                        />
                    </>
                    :
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold mb-5">YOUR WISHLIST IS EMPTY</h2>
                        {
                            status === "authenticated" ?
                                <>
                                    <p>When you have added something to the wishlist, it will appear here. Want to get started?</p>
                                    <span><Link href="/">Start</Link></span>
                                </>
                                :
                                <>
                                    <p>Not registered? You must be in order to save your favorite products.</p>
                                    <span><Link href="/login">Login</Link></span>
                                </>
                        }
                    </div>
            }
        </section>
    );
}

export default Wishlists;