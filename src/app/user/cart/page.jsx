"use client";

import { useProductContext } from "@/helpers/ProductContext";
import { useCart } from "../../../helpers/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
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
    }

    fetchAllProducts();

    if (cartItems && cartItems[0]) {
      const cartItemsWithProducts = cartItems.map(cartItem => {
        const product = products.find(product => product._id === cartItem.product);
        if (product) {
          return { ...product, quantity: cartItem.quantity, color: cartItem.color, size: cartItem.size };
        }
        return null;
      });

      const validCartItemsWithProducts = cartItemsWithProducts.filter(item => item !== null);
      setCartWithProducts(validCartItemsWithProducts);
      setIsLoading(false);
    }

  }, [cartItems, products]);

  return (
    <section>
      <h2>Carrito de Compra</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Products products={cartWithProducts} />
      )}
    </section>
  );
}

export default Cart;
