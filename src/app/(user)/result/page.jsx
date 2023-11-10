"use client"

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/hooks/CartContext';
import { saveOrder } from "@/helpers/ordersFunctions";
import { Loader } from "@/helpers/Loader";
import { useSession } from 'next-auth/react';
import emailjs from "@emailjs/browser";

import '@/styles/alert.css';

const CheckoutSuccess = () => {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { setCartItems } = useCart();
  const [data, setData] = useState();
  const [hasSavedOrder, setHasSavedOrder] = useState(false);
  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (session_id && data === undefined) {
      fetchCheckoutData(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout_sessions?session_id=${session_id}`);
    }
  }, [session_id]);

  useEffect(() => {
    if (data?.status === "complete" && status === "authenticated") {
      setCartItems([]);
      emptyCart();
    }
  }, [status, data]);

  useEffect(() => {
    if (data?.status === "complete" && !hasSavedOrder) {
      saveOrder(data, setHasSavedOrder);

      const templateParams = {
        name: data.customer_details.name,
        email: data.customer_details.email,
      };

      emailjs
        .send(
          "service_r19xijn",
          "template_p9rex9q",
          templateParams,
          "zCpXvv0LiIoJvc0rf"
        )
        .then(
          function (response) {
            console.log("SUCCESS EMAIL!", response.status, response.text);
            alert("Thanks, Email sent successfully");
          },
          function (error) {
            alert("OOPs something went wrong when sending your email... Try again later");
            console.log("EMAIL FAILED...", error);
          }
        );
    }
  }, [data]);

  useEffect(() => {
    document.title = "Purchase Result | Ecommerce Template"
  }, [])

  const fetchCheckoutData = async (url) => {
    try {
      const responseData = await fetch(url).then((res) => res.json());
      setData(responseData);
    } catch (err) {
      setData({
        error: true,
        errorMessage: "There was an error getting the data from the server.",
      });
      console.error("Error obtaining data:", err.message);
    }
  };

  const emptyCart = async () => {
    try {
      await axios.put(`/api/cart?userId=${session.user._id}`, {
        cart: [],
      });
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return (
    <section>
      <div className="info-msg">
        {data && data.error ?
          <p>{data.errorMessage}</p>
          : data && hasSavedOrder ?
            <>
              <h1>Checkout Payment Result</h1>
              <h3>Successful payment</h3>
              <p>{`An email has been sent to you at: ${data.customer_details.email}`}</p>
            </>
            :
            <Loader />
        }
      </div>
    </section>
  );
}

export default CheckoutSuccess;