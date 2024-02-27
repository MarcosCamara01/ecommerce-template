"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchUserCart } from "@/helpers/serverCart";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [userCart, setUserCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true)

  useEffect(() => {
    fetchCartAndUpdateState();
  }, [])

  const fetchCartAndUpdateState = async () => {
    const userCart = await fetchUserCart();
    if (userCart) {
      setCartItems(userCart.cart);
      setUserCart(userCart);
    } else {
      setCartItems([]);
      setUserCart(null);
    }
    setCartLoading(false);
  };

  return (
    <CartContext.Provider value={{ cartItems, setCartItems, userCart, setUserCart, cartLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(CartContext);
}