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

  console.log(cartItems)

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (products.length === 0) {
        await fetchProducts(setProducts);
      }
    }

    fetchAllProducts();

    if (cartItems && cartItems.length > 0) {
      const productMap = new Map();
      
      cartItems.forEach(cartItem => {
        const productKey = cartItem.product;
        if (productMap.has(productKey)) {
          productMap.set(productKey, productMap.get(productKey) + 1);
        } else {
          productMap.set(productKey, 1);
        }
      });

      const uniqueCartProducts = Array.from(productMap.keys()).map(productId => {
        const product = products.find(product => product._id === productId);
        return {
          ...product,
          quantity: productMap.get(productId),
        };
      });

      setCartWithProducts(uniqueCartProducts);
      setIsLoading(false);
    }
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