"use client";

import { useCart } from "../../../hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';
import { ButtonCheckout } from "@/components/CartElements"
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader } from "@/helpers/Loader";
import { getProducts } from "@/helpers/getProducts"

const Cart = () => {
  const { cartItems, cartLoading } = useCart();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState([]);
  const [isLoading, setIsLoading] = useState(true)
  const { status } = useSession();

  const fetchProducts = async (productId) => {
    try {
      const products = await getProducts(`_id=${productId}`);
      return products;
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
                images: [matchingVariant.image],
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
            <h2>TU CARRITO DE LA COMPRA</h2>
            <Products
              products={cartWithProducts}
            />

            <div className="cart-footer">
              <div className="cart-price">
                <div className="price">
                  <span>Total:</span>
                  <span>{totalPrice}€</span>
                </div>
                <span className="taxes">+ IMPUESTOS INCLUIDOS</span>
              </div>
              <div className="cart-button">
                <ButtonCheckout
                  cartWithProducts={cartWithProducts}
                />
              </div>
            </div>
          </>
          :
          <>
            <h2>TU CARRITO ESTÁ VACÍO</h2>
            {status === "authenticated" ?
              <>
                <h3>Cuando hayas añadido algo al carrito, aparecerá aquí. ¿Quieres empezar?</h3>
                <Link href="/">Comenzar</Link>
              </>
              :
              <p>No estás registrado? Necesitas estarlo para poder guardar tus productos al carrito. <Link href="/login">Login</Link></p>
            }
          </>
      }
    </section>
  );
}

export default Cart;
