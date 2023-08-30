"use client"

import { useProductContext } from "@/helpers/ProductContext";
import { useCart } from "../../../helpers/CartContext";
import { useEffect, useState } from "react";
import { fetchProducts } from "@/helpers/fetchProducts";
import { Products } from "@/components/Products";

const Cart = () => {
  const { cartItems } = useCart();
  const { products, setProducts } = useProductContext();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const productData = await products;

      if (productData.length === 0) {
        await fetchProducts(setProducts);
      }
      
      console.log(cartItems, productData)

      const cartItemsWithProducts = await cartItems.map(cartItem => {
        return productData.find(product => product._id === cartItem.product);
      });

      setCartWithProducts(cartItemsWithProducts);
      setIsLoading(false);
    };

    fetchProduct();
  }, [cartItems, products, setProducts]);

  console.log(cartWithProducts)

  return (
    <section>
      <h2>Carrito de Compra</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <h2>Hola</h2>
      )}
    </section>
  );
}

export default Cart;
