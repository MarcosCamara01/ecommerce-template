"use client";

import { useProductContext } from "@/hooks/ProductContext";
import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";

const Wishlists = () => {
    const { userCart, loading } = useCart();
    const { products } = useProductContext();
    const [cartWithProducts, setCartWithProducts] = useState([]);
    const { status } = useSession();

    useEffect(() => {
        const updateCartWithProducts = () => {
            if (userCart && userCart.favorites) {
                const updatedCart = userCart.favorites.map((productId) => {
                    const matchingProduct = products.find(
                        (product) => product._id === productId
                    );

                    if (matchingProduct) {
                        return {
                            ...matchingProduct,
                        };
                    }

                    return null;
                });

                setCartWithProducts(updatedCart.reverse());
            }
        };

        updateCartWithProducts();
    }, [userCart, products]);

    return (
        <section>
            {loading ?
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