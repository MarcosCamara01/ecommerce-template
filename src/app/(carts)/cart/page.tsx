"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/products/Products";
import { ButtonCheckout } from "@/components/cart/CartElements"
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/components/Loader";
import { productsCart } from "@/helpers/clientCart";

const Cart = () => {
  const { cartItems, cartLoading } = useCart();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useSession();

  useEffect(() => {
    productsCart(cartItems, cartLoading, setCartWithProducts, setIsLoading, setTotalPrice);
  }, [cartItems, cartLoading]);

  useEffect(() => {
    document.title = "Cart | Ecommerce Template";
  }, [])

  return (
    <div className="pt-12">
      {isLoading ?
        <Loader />
        :
        cartWithProducts.length >= 1 ?
          <>
            <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR SHOPPING CART</h2>
            <Products
              products={cartWithProducts}
              extraClassname={"cart-ord-mobile"}
            />

            <div className="fixed bottom-0 right-0 flex items-center justify-end w-full h-20 gap-0 text-sm bg-black border-t border-solid sm:gap-12 border-border-primary">
              <div className="flex flex-col justify-between w-3/6 gap-2 text-center sm:w-min">
                <div className="flex gap-2.5 justify-center">
                  <span>Total:</span>
                  <span>{totalPrice}€</span>
                </div>
                <span className="text-xs">+ TAX INCL.</span>
              </div>
              <div className="w-3/6 h-20 sm:max-w-180 sm:w-full">
                <ButtonCheckout
                  cartWithProducts={cartWithProducts}
                />
              </div>
            </div>
          </>
          :
          <div className="flex flex-col gap-2">
            <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR CART IS EMPTY</h2>
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
    </div>
  );
}

export default Cart;
