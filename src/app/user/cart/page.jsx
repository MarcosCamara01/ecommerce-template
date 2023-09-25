"use client";

import { useProductContext } from "@/hooks/ProductContext";
import { useCart } from "../../../hooks/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';
import { ButtonCheckout } from "@/components/CartElements"
import { useSession } from "next-auth/react";
import Link from "next/link";

const Cart = () => {
  const { cartItems } = useCart();
  const { products } = useProductContext();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useSession();

  useEffect(() => {
    const updateCartWithProducts = () => {
      const updatedCart = cartItems.map((cartItem) => {
        const matchingProduct = products.find(
          (product) => product._id === cartItem.productId
        );

        if (matchingProduct) {
          return {
            ...cartItem,
            category: matchingProduct.category,
            images: matchingProduct.images,
            name: matchingProduct.name,
            price: matchingProduct.price,
          };
        }

        return cartItem;
      });

      setCartWithProducts(updatedCart);
      setIsLoading(false);
    };

    updateCartWithProducts();
  }, [cartItems, products]);

  const calculateTotalPrice = (cartItems, products) => {
    const totalPrice = cartItems.reduce((total, cartItem) => {
      const matchingProduct = products.find(
        (product) => product._id === cartItem.productId
      );

      if (matchingProduct) {
        return total + matchingProduct.price * cartItem.quantity;
      }

      return total;
    }, 0);

    return totalPrice.toFixed(2);
  };

  const totalPrice = calculateTotalPrice(cartWithProducts, products);

  return (
    <section>
      {isLoading ?
        <p>Loading...</p>
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