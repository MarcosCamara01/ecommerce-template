"use client"

import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchUserCart } from "@/helpers/cartFunctions";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session, status } = useSession()
  const [cartItems, setCartItems] = useState([]);
  const [userCart, setUserCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      fetchCartAndUpdateState();
    } else if (status === "unauthenticated") {
      setCartItems([]);
      setUserCart(null);
      setCartLoading(false)
    }
  }, [status]);

  const fetchCartAndUpdateState = async () => {
    const userCart = await fetchUserCart(session, setCartLoading);
    if (userCart) {
      setCartItems(userCart.cart);
      setUserCart(userCart);
    } else {
      setCartItems([]);
      setUserCart(null);
    }
  };

  const addToCart = async (productId, color, size, quantity, variantId) => {
    const newItem = {
      productId,
      color,
      size,
      quantity,
      variantId
    };

    let updatedCart = [...cartItems];

    const existingItemIndex = updatedCart.findIndex(
      (item) =>
        item.productId === productId &&
        item.color === color &&
        item.size === size
    );

    if (existingItemIndex !== -1) {
      updatedCart[existingItemIndex].quantity += quantity;
    } else {
      updatedCart = [...updatedCart, newItem];
    }

    if (status === "authenticated") {
      try {
        const userId = session.user._id;

        if (!userId) {
          console.error("The user _id could not be obtained.");
          return;
        }

        let userCartToUpdate = userCart;
        if (!userCartToUpdate) {
          userCartToUpdate = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart`, {
            cart: updatedCart,
            userId: userId
          });
          console.log('Cart created on the server');
        } else {
          const id = userCartToUpdate._id
          userCartToUpdate = await axios.put(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart?id=${id}`, {
            cart: updatedCart,
          });
          console.log('Cart updated on the server');
        }

        setUserCart(userCartToUpdate.data);
        setCartItems(updatedCart);

      } catch (error) {
        console.error('Error updating/creating cart on the server:', error);
      }
    } else {
      // Si no hay un usuario autenticado, usar cookies.
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, setCartItems, addToCart, userCart, setUserCart, cartLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(CartContext);
}