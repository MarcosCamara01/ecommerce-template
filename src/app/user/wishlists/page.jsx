"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";
import { getProducts } from "@/helpers/getProducts";

const Wishlists = () => {
    const { userCart, cartLoading } = useCart();
    const [cartWithProducts, setCartWithProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true)
    const { status } = useSession();

    const fetchProducts = async (productId) => {
        try {
            const products = await getProducts(`_id=${productId}`);
            return products;
        } catch (error) {
            console.error("Error al obtener los productos:", error);
            return null;
        }
    };

    useEffect(() => {
        const updateCartWithProducts = async () => {
            if (userCart && userCart.favorites) {
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
            } else if (!cartLoading && userCart.favorites.length === 0) {
                setIsLoading(false)
            }
        };


        updateCartWithProducts();
    }, [userCart]);

    return (
        <section>
            {isLoading ?
                <Loader />
                :
                cartWithProducts.length >= 1 ?
                    <>
                        <h2>MI LISTA DE DESEOS</h2>
                        <Products
                            products={cartWithProducts}
                        />
                    </>
                    :
                    <>
                        <h2>TU LISTA DE DESEOS ESTÁ VACÍA</h2>
                        {
                            status === "authenticated" ?
                                <>
                                    <h3>Cuando hayas añadido algo a la lista de deseos, aparecerá aquí. ¿Quieres empezar?</h3>
                                    <Link href="/">Comenzar</Link>
                                </>
                                :
                                <p>No estás registrado? Necesitas estarlo para poder guardar tus productos favoritos. <Link href="/login">Login</Link></p>
                        }
                    </>
            }
        </section>
    );
}

export default Wishlists;