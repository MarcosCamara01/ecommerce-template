"use client"

import { useCart } from "../../../helpers/CartContext";

const Cart = () => {
    const { cartItems } = useCart();

    return (
      <section>
        <h2>Carrito de Compra</h2>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>{item.name}</li>
          ))}
        </ul>
      </section>
    );
}

export default Cart;