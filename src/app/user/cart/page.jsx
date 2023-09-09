"use client";

import { useProductContext } from "@/helpers/ProductContext";
import { useCart } from "../../../helpers/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import '../../../styles/cart.css';

const Cart = () => {
  const { cartItems } = useCart();
  const { products } = useProductContext();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const calculateTotalPrice = (cartItems) => {
    const totalPrice = cartItems.reduce((total, cartItem) => {
      return total + cartItem.price * cartItem.quantity;
    }, 0);
    return totalPrice.toFixed(2);
  };

  return (
    <section>
      <h2>Carrito de Compra</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Products
            products={cartWithProducts}
          />

          <div className="cart-footer">
            <div className="cart-price">
              <div className="price">
                <span>Total:</span>
                <span>{calculateTotalPrice(cartWithProducts)}€</span>
              </div>
              <span className="taxes">+ IMPUESTOS INCLUIDOS</span>
            </div>
            <div className="cart-button">
              <button>CONTINUAR</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Cart;