"use client"

import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session, status } = useSession()
  const [cartItems, setCartItems] = useState([]);
  const [userCart, setUserCart] = useState(null);

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
        setUserCart(userCart);
      } else {
        setCartItems([]);
        setUserCart(null);
      }
    };

    fetchCartAndUpdateState();
  }, [status, session]);

  const addToCart = async (productId, color, size, quantity) => {
    const newItem = {
      product: productId,
      color,
      size,
      quantity,
    };

    let updatedCart = [...cartItems];

    const existingItemIndex = updatedCart.findIndex(
      (item) =>
        item.product === productId &&
        item.color === color &&
        item.size === size
    );

    if (existingItemIndex !== -1) {
      updatedCart[existingItemIndex].quantity += quantity;
    } else {
      updatedCart = [...updatedCart, newItem];
    }

    setCartItems(updatedCart);

    if (status === "authenticated") {
      try {
        const userId = session.user._id;

        if (!userId) {
          console.error('No se pudo obtener el _id del usuario.');
          return;
        }

        let userCartToUpdate = userCart;
        if (!userCartToUpdate) {
          userCartToUpdate = await axios.post(`/api/cart`, {
            cart: updatedCart,
            userId: userId
          });
          console.log('Cart created on the server');
        } else {
          await axios.put(`/api/cart?id=${userCartToUpdate._id}`, {
            cart: updatedCart,
          });
          console.log('Cart updated on the server');
        }

        setUserCart(userCartToUpdate);

      } catch (error) {
        console.error('Error updating/creating cart on the server:', error);
      }
    } else {
      // Si no hay un usuario autenticado, usar cookies.
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