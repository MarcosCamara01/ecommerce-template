"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import { ButtonCheckout } from "@/components/CartElements"
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";
import { productsCart } from "@/helpers/cartFunctions";
import { Toaster, toast } from 'sonner'
import { useSearchParams } from "next/navigation";

import '@/styles/cart.css';

const Cart = () => {
  const { cartItems, cartLoading } = useCart();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');
  const { status } = useSession();

  useEffect(() => {
    productsCart(cartItems, cartLoading, setCartWithProducts, setIsLoading, setTotalPrice);
  }, [cartItems, cartLoading]);

  useEffect(() => {
    document.title = "Cart | Ecommerce Template";
  }, [])

  useEffect(() => {
    if (canceled == "true") {
      toast.info('Payment successfully cancelled');
    }
  }, [canceled])

  return (
    <section className="page-section">
      {isLoading ?
        <Loader />
        :
        cartWithProducts.length >= 1 ?
          <>
            <h2 className="text-2xl	font-bold mb-5">YOUR SHOPPING CART</h2>
            <Products
              products={cartWithProducts}
              extraClassname={"cart-ord-mobile"}
            />

            <div className="cart-footer">
              <div className="cart-price">
                <div className="price">
                  <span>Total:</span>
                  <span>{totalPrice}€</span>
                </div>
                <span className="taxes">+ TAX INCL.</span>
              </div>
              <div className="cart-button">
                <ButtonCheckout
                  cartWithProducts={cartWithProducts}
                />
              </div>
            </div>
          </>
          :
          <div className="info-msg">
            <h2>YOUR CART IS EMPTY.</h2>
            {status === "authenticated" ?
              <>
                <p>When you have added something to your cart, it will appear here. Want to get started?</p>
                <span><Link href="/">Start</Link></span>
              </>
              :
              <>
                <p>Not registered? You must be in order to save your products in the shopping cart.</p>
                <span><Link href="/login">Login</Link></span>
              </>
            }
          </div>
      }
      <Toaster position="bottom-right" />
    </section>
  );
}

export default Cart;
