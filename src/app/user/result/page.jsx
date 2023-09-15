"use client"

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '../../../helpers/CartContext';

function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const { userCart, setCartItems } = useCart();
  const [data, setData] = useState();

  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (session_id) {
      if (data === undefined) {
        fetchGetJSON(`/api/stripe/checkout_sessions?session_id=${session_id}`);
      }
      if (userCart != null && userCart.cart.length > 0) {
        emptyCart();
      }
    }
  }, [session_id, userCart]);

  const fetchGetJSON = async (url) => {
    try {
      const data = await fetch(url).then((res) => res.json());
      setData(data)
      console.log(data)
    } catch (err) {
      throw new Error(err.message);
    }
  }

  const emptyCart = async () => {
    try {
      const cart = await axios.put(`/api/cart?id=${userCart._id}`, {
        cart: [],
      });
      setCartItems([]);
      console.log(cart)
    } catch (error) {
      throw new Error(error.message);
    }
  }

  if (data !== undefined) {
    const productsMetadata = JSON.parse(data.metadata.products);
  }

  return (
    <section>
      <div className="page-container">
        <h1>Checkout Payment Result</h1>
        <h2>{data !== undefined ? "Pago realizado con éxito" : "Ha habido algún problema al completar el pago"}</h2>
        <h3>{data !== undefined && `Se te ha enviado un mail a: ${data.customer_details.email}`}</h3>
      </div>
    </section>
  );
}

export default CheckoutSuccess;
