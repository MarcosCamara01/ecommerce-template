"use client"

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/CartContext';

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
  }, [session_id]);

  useEffect(() => {
    if (session_id && userCart != null && userCart.cart.length > 0) {
      emptyCart();
    }
  }, [userCart, session_id]);

  useEffect(() => {
    if (data?.status === "complete" && !hasSavedOrder) {
      const userId = data.metadata?.userId;
      const products = data.metadata?.products ? JSON.parse(data.metadata.products) : [];
      const newOrder = {
        name: data.customer_details?.name || "",
        email: data.customer_details?.email || "",
        phone: data.customer_details?.phone || "",
        address: {
          line1: data.customer_details?.address?.line1 || "",
          line2: data.customer_details?.address?.line2 || "",
          city: data.customer_details?.address?.city || "",
          state: data.customer_details?.address?.state || "",
          postal_code: data.customer_details?.address?.postal_code || "",
          country: data.customer_details?.address?.country || "",
        },
        products: products,
        orderId: data.id,
      };

      const saveOrder = async () => {
        try {
          const response = await axios.get(`/api/orders`);
          const userOrders = response.data.find((order) => order.userId === userId);
      
          if (userOrders) {
            const orderIdMatch = userOrders.orders.some(order => order.orderId === data.id);
            if (!orderIdMatch) {
              const updatedOrders = [...userOrders.orders, newOrder];
              const response = await axios.put(`/api/orders?id=${userOrders._id}`, {
                orders: updatedOrders,
              });
              console.log("Pedidos actualizados con éxito", response);
            } else {
              console.error("Ya se ha guardado este pedido");
            }
          } else {
            const updatedOrders = [newOrder];
            const response = await axios.post('/api/orders', {
              userId: userId,
              order: updatedOrders,
            });
            console.log("Pedido creado y guardado con éxito", response);
          }
      
          setHasSavedOrder(true);
        } catch (error) {
          console.error('Error al guardar la orden:', error);
        }
      };

      saveOrder();
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
        <h1>Checkout Payment Result</h1>
        {data && data.error ? (
          <p>{data.errorMessage}</p>
        ) : data ? (
          <>
            <h2>Pago realizado con éxito</h2>
            <h3>{`Se te ha enviado un correo electrónico a: ${data.customer_details.email}`}</h3>
          </>
        ) : (
          <p>Cargando...</p>
        )}
      </div>
    </section>
  );
}

export default CheckoutSuccess;