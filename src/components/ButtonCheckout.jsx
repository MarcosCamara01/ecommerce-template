import axios from 'axios';
import React from 'react';

export const ButtonCheckout = ({ cartWithProducts }) => {
  const buyProducts = async () => {
    try {
      const lineItems = await cartWithProducts.map((cartItem) => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
      }));

      const { data: session } = await axios.post('/api/payment', {
        lineItems,
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
