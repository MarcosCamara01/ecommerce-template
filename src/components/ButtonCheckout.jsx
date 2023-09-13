import axios from 'axios';
import React from 'react';
import { useCart } from '../helpers/CartContext';

export const ButtonCheckout = ({ cartWithProducts }) => {
  const { userCart } = useCart();

  const buyProducts = async () => {
    try {
      const lineItems = await cartWithProducts.map((cartItem) => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      }));

      const { data: session } = await axios.post('/api/payment', {
        lineItems,
        userId: userCart.userId
      });

      window.location.href = session.url;

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button onClick={buyProducts}>CONTINUAR</button>
  )
}
