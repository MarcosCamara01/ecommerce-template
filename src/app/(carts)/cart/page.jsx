"use client";

import { useCart } from "@/hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import { ButtonCheckout } from "@/components/CartElements"
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";

import '@/styles/cart.css';
import '@/styles/alert.css';

const Cart = () => {
  const { cartItems, cartLoading } = useCart();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useSession();

  const fetchProducts = async (productId) => {
    try {
      const res = await fetch(`/api/products?_id=${productId}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
      }

      return res.json();
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      return null;
    }
  };

  const calculateTotalPrice = (cartItems) => {
    let totalPrice = 0;

    for (const cartItem of cartItems) {
      totalPrice += cartItem.price * cartItem.quantity;
    }

    return totalPrice.toFixed(2);
  };

  useEffect(() => {
    const updateCartWithProducts = async () => {
      if (cartItems.length >= 1) {
        const updatedCart = await Promise.all(cartItems.map(async (cartItem) => {
          try {
            const matchingProduct = await fetchProducts(cartItem.productId);
            if (matchingProduct) {
              const matchingVariant = matchingProduct.variants.find((variant) => variant.color === cartItem.color);
              return {
                ...cartItem,
                category: matchingProduct.category,
                image: matchingVariant.images[0],
                name: matchingProduct.name,
                price: matchingProduct.price,
              };
            }
          } catch (error) {
            console.error("Error al obtener detalles del producto:", error);
          }
        }));
        const totalPrice = await calculateTotalPrice(updatedCart);
        setCartWithProducts(updatedCart.reverse());
        setIsLoading(false);
        setTotalPrice(totalPrice);
      } else if (!cartLoading && cartItems.length === 0) {
        setCartWithProducts([]);
        setIsLoading(false);
      }
    };

    updateCartWithProducts();
  }, [cartItems, cartLoading]);

  return (
    <section>
      {isLoading ?
        <Loader />
        :
        cartWithProducts.length >= 1 ?
          <>
            <h2 className="section-h2">YOUR SHOPPING CART</h2>
            <Products
              products={cartWithProducts}
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
          <div className="bx-info">
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
    </section>
  );
}

export default Cart;
