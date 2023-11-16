"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";
import { productsWislists } from "@/helpers/cartFunctions";

import '@/styles/cart.css';
import '@/styles/alert.css';

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
        <section className="page-section">
            {isLoading ?
                <Loader />
                :
                cartWithProducts.length >= 1 ?
                    <>
                        <h2 className="section-h2">YOUR WISHLISTS</h2>
                        <Products
                            products={cartWithProducts}
                            extraClassname={"colums-mobile"}
                        />
                    </>
                    :
                    <div className="info-msg">
                        <h2>YOUR WISHLIST IS EMPTY</h2>
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