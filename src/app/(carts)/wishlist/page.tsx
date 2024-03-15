"use client";

import { useEffect, useState } from "react";
import { Products } from "@/components/products/Products";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useFavorites } from "@/hooks/FavoritesContext";
import { ProductDocument } from "@/types/types";
import { getProducts } from "@/helpers/getProducts";
import { Loader } from "@/components/Loader";

const Wishlists = () => {
    const { userFavorites } = useFavorites();
    const [productsFavorites, setProductsFavorites] = useState<ProductDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true)
    const { status } = useSession();

    useEffect(() => {
        document.title = "Wishlist | Ecommerce Template"
    }, []);

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (userFavorites && userFavorites.favorites) {
                const updatedCart = await Promise.all(userFavorites.favorites.map(async (productId: string) => {
                    const matchingProduct = await getProducts(`?_id=${productId}`);
                    return matchingProduct;
                }));

                setProductsFavorites(updatedCart.filter(product => product !== null) as ProductDocument[]);
                setIsLoading(false);
            }
        };
        if (status === "authenticated") {
            fetchWishlistProducts();
        } else if (status === "unauthenticated") {
            setIsLoading(false);
        }
    }, [userFavorites, status]);

    return (
        <section className="pt-12">
            {isLoading ?
                <div className='spinner-center'>
                    <Loader height={25} width={25} />
                </div>
                :
                productsFavorites.length >= 1 ?
                    <>
                        <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLISTS</h2>
                        <Products
                            products={productsFavorites}
                            extraClassname={"colums-mobile"}
                        />
                    </>
                    :
                    <div className="flex flex-col gap-2">
                        <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLIST IS EMPTY</h2>
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