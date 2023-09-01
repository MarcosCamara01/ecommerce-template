"use client"

import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session, status } = useSession()
  const [cartItems, setCartItems] = useState([]);

  const fetchUserCart = async () => {
    if (status === "authenticated") {
      try {
        const userId = session.user._id;
        const response = await axios.get(`/api/cart`);
        const userCart = response.data.find((cart) => cart.userId === userId);
        return userCart;
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchCartAndUpdateState = async () => {
      const userCart = await fetchUserCart();
      if (userCart) {
        setCartItems(userCart.cart);
      } else {
        setCartItems([]);
      }
    };

    fetchCartAndUpdateState();
  }, [status, session]);

  const addToCart = async (product) => {
    const updatedCart = [...cartItems, product];

    if (status === "authenticated") {
      try {
        const userId = session.user._id;
        let userCart = await fetchUserCart();

        if (!userId) {
          console.error('No se pudo obtener el _id del usuario.');
          return;
        }

        if (!userCart) {
          userCart = await axios.post(`/api/cart`, {
            cart: updatedCart,
            userId: userId
          });
          console.log('Cart created on the server');
        } else {
          await axios.put(`/api/cart?id=${userCart._id}`, {
            cart: updatedCart,
          });
          console.log('Cart updated on the server');
        }

      } catch (error) {
        console.error('Error updating/creating cart on the server:', error);
      }
    }

    setCartItems(updatedCart);
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
