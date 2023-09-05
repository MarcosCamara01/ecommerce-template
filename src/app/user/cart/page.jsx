"use client";

import { useProductContext } from "@/helpers/ProductContext";
import { useCart } from "../../../helpers/CartContext";
import { useEffect, useState } from "react";
import { CartProducts } from "@/components/CartProducts";
import { fetchProducts } from '@/helpers/fetchProducts';

const Cart = () => {
  const { cartItems } = useCart();
  const { products, setProducts } = useProductContext();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (products.length === 0) {
        await fetchProducts(setProducts);
      }
    };

    const updateCartWithProducts = () => {
      const updatedCart = cartItems.map((cartItem) => {
        const matchingProduct = products.find(
          (product) => product._id === cartItem.product
        );

        if (matchingProduct) {
          return {
            ...cartItem,
            category: matchingProduct.category,
            image: matchingProduct.images,
            name: matchingProduct.name,
            price: matchingProduct.price,
          };
        }

        return cartItem;
      });

      setCartWithProducts(updatedCart);
      setIsLoading(false);
    };

    fetchAllProducts();
    updateCartWithProducts();
  }, [cartItems, products]);

  return (
    <section>
      <h2>Carrito de Compra</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <CartProducts products={cartWithProducts} />
      )}
    </section>
  );
}

export default Cart;