"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/products/Products";
import { ButtonCheckout } from "@/components/cart/CartElements"
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";
import { productsCart } from "@/helpers/cartFunctions";
import { Toaster, toast } from 'sonner'
import { useSearchParams } from "next/navigation";

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
    <div className="pt-12">
      {isLoading ?
        <Loader />
        :
        cartWithProducts.length >= 1 ?
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-5">YOUR SHOPPING CART</h2>
            <Products
              products={cartWithProducts}
              extraClassname={"cart-ord-mobile"}
            />

            <div className="fixed bottom-0 right-0 w-full h-20 flex justify-end	items-center gap-0 sm:gap-12 text-sm border-t border-solid border-border-primary bg-black">
              <div className="flex flex-col justify-between text-center gap-2 w-3/6	sm:w-min">
                <div className="flex gap-2.5 justify-center">
                  <span>Total:</span>
                  <span>{totalPrice}€</span>
                </div>
                <span className="text-xs">+ TAX INCL.</span>
              </div>
              <div className="h-20 w-3/6 sm:max-w-180 sm:w-full">
                <ButtonCheckout
                  cartWithProducts={cartWithProducts}
                />
              </div>
            </div>
          </>
          :
          <div className="flex flex-col gap-2">
            <h2 className="text-xl sm:text-2xl font-bold mb-5">YOUR CART IS EMPTY</h2>
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
    </div>
  );
}

export default Cart;
