"use client";

import { useEffect, useState } from "react";
import { Products } from "@/components/products/Products";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useFavorites } from "@/hooks/FavoritesContext";
import { ProductDocument } from "@/types/types";
import { getProducts } from "@/helpers/getProducts";
import { Loader } from "@/components/common/Loader";

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
            } else {
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
        <section className="h-full pt-12">
            {isLoading ?
                <Loader height={25} width={25} />
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
                    <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
                        <h2 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h2>
                        {
                            status === "authenticated" ?
                                <>
                                    <p className="mb-4 text-lg">When you have added something to the wishlist, it will appear here. Want to get started?</p>
                                    <Link
                                        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                                        href="/"
                                    >
                                        Start
                                    </Link>
                                </>
                                :
                                <>
                                    <p className="mb-4 text-lg">Not registered? You must be in order to save your favorite products.</p>
                                    <Link
                                        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                                        href="/login"
                                    >
                                        Login
                                    </Link>
                                </>
                        }
                    </div>
            }
        </section>
    );
}

export default Wishlists;