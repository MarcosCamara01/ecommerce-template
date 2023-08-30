"use client"

import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session } = useSession()
    const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (session) {
      setCartItems(session.user.cart || []);
    }
  }, []);

  const addToCart = async (product) => {
    setCartItems([...cartItems, product]);

    if (session) {
      try {
        await axios.put('/api/auth/signup', {
          userId: session.user._id,
          cart: [...cartItems, product],
        });
        console.log('Cart updated on the server');
      } catch (error) {
        console.error('Error updating cart on the server:', error);
      }
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
