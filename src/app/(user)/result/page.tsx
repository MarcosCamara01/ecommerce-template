"use client"

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/CartContext';
import { saveOrder } from "@/helpers/ordersFunctions";
import { Loader } from "@/helpers/Loader";
import { useSession } from 'next-auth/react';
import { sendEmail } from "@/helpers/sendEmail";
import Stripe from 'stripe';

const CheckoutSuccess = () => {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { cartItems, setCartItems } = useCart();
  const [data, setData] = useState<Stripe.Checkout.Session | { error: boolean, errorMessage: string }>();
  const [hasSavedOrder, setHasSavedOrder] = useState(false);
  const [hasSent, sethasSent] = useState(false);
  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (session_id && data === undefined) {
      fetchCheckoutData(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout_sessions?session_id=${session_id}`);
    }
  }, [session_id]);

  useEffect(() => {
    if (data && 'status' in data && data.status === 'complete' && status === "authenticated" && hasSavedOrder) {
      setCartItems([]);
      emptyCart();
    }
  }, [status, data, hasSavedOrder]);

  useEffect(() => {
    if (data && 'status' in data && data.status === 'complete' && !hasSavedOrder) {
      saveOrder(data, setHasSavedOrder, cartItems);

      sendEmail(data, sethasSent);
    }
  }, [data]);

  useEffect(() => {
    document.title = "Purchase Result | Ecommerce Template"
  }, [])

  const fetchCheckoutData = async (url: string) => {
    try {
      const responseData = await fetch(url).then((res) => res.json());
      setData(responseData);
    } catch (err: any) {
      setData({
        error: true,
        errorMessage: "There was an error getting the data from the server.",
      });
      console.error("Error obtaining data:", err.message);
    }
  };

  const emptyCart = async () => {
    try {
      await axios.put(`/api/cart?userId=${session?.user._id}`, {
        cart: [],
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return (
    <section className="pt-12">
      <div className="flex flex-col gap-2">
        {data && 'error' in data ?
          <p>{data.errorMessage}</p>
          : data && hasSavedOrder && hasSent ?
            <>
              <h1 className='mb-3 text-xl font-bold sm:text-2xl'>Checkout Payment Result</h1>
              <h3 className='text-lg font-semibold'>Successful payment</h3>
              {data.customer_details && (
                <p>{`An email has been sent to you at: ${data.customer_details.email}`}</p>
              )}
            </>
            :
            <Loader />
        }
      </div>
    </section>
  );
}

export default CheckoutSuccess;