"use client";

import { useProductContext } from "@/hooks/ProductContext";
import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';

const Wishlists = () => {
    const { userCart } = useCart();
    const { products } = useProductContext();
    const [cartWithProducts, setCartWithProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
    
                setCartWithProducts(updatedCart);
                setIsLoading(false);
            }
        };
    
        updateCartWithProducts();
    }, [userCart]);    

    return (
        <section>
            <h2>MI LISTA DE DESEOS</h2>

            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <Products
                    products={cartWithProducts}
                />
            )}
        </section>
    );
}

export default Wishlists;