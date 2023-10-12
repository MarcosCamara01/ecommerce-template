"use client"

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/CartContext';
import { saveOrder } from "@/helpers/ordersFunctions";
import { Loader } from "@/helpers/Loader";

function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const { userCart, setCartItems } = useCart();
  const [data, setData] = useState();
  const [hasSavedOrder, setHasSavedOrder] = useState(false);

  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (session_id && data === undefined) {
      fetchCheckoutData(`/api/stripe/checkout_sessions?session_id=${session_id}`);
    }
  }, [session_id, data]);  

  useEffect(() => {
    if (session_id && userCart != null && userCart.cart.length > 0) {
      emptyCart();
    }
  }, [userCart, session_id]);
  
  useEffect(() => {
    if (data?.status === "complete" && !hasSavedOrder) {
      saveOrder(data, setHasSavedOrder);
    }
  }, [data, hasSavedOrder]);

  const fetchCheckoutData = async (url) => {
    try {
      const responseData = await fetch(url).then((res) => res.json());
      setData(responseData);
    } catch (err) {
      setData({
        error: true,
        errorMessage: "Hubo un error al obtener los datos del servidor.",
      });
      console.error("Error al obtener datos:", err.message);
    }
  };

  const emptyCart = async () => {
    try {
      await axios.put(`/api/cart?id=${userCart._id}`, {
        cart: [],
      });
      setCartItems([]);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return (
    <section>
      <div className="page-container">
        {data && data.error ?
          <p>{data.errorMessage}</p>
          : data ?
            <>
              <h1>Checkout Payment Result</h1>
              <h2>Pago realizado con éxito</h2>
              <h3>{`Se te ha enviado un correo electrónico a: ${data.customer_details.email}`}</h3>
            </>
            :
            <Loader />
        }
      </div>
    </section>
  );
}

export default CheckoutSuccess;