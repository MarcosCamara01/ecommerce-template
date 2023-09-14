"use client"

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function CheckoutSuccess() {
  const searchParams = useSearchParams()

  const session_id = searchParams.get('session_id');

  const fetchGetJSON = async (url) => {
    try {
      const data = await fetch(url).then((res) => res.json());
      console.log(data)
    } catch (err) {
      throw new Error(err.message);
    }
  }

  useEffect(() => {
    if (session_id) {
      fetchGetJSON(`/api/stripe/checkout_sessions?session_id=${session_id}`);
    }
  }, [session_id])

  return (
    <section>
      <div className="page-container">
        <h1>Checkout Payment Result</h1>
        <h2>{session_id ? "Pago realizado con éxito" : "Ha habido algún problema al completar el pago"}</h2>
      </div>
    </section>
  );
}

export default CheckoutSuccess;
