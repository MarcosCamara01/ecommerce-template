"use client"

import { useProductContext } from "@/helpers/ProductContext";
import { useCart } from "../../../helpers/CartContext";
import { useEffect, useState } from "react";
import { Products } from "@/components/Products";
import { fetchProducts } from '@/helpers/fetchProducts';

const Cart = () => {
  const { cartItems } = useCart();
  const { products, setProducts } = useProductContext();
  const [cartWithProducts, setCartWithProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (products.length === 0) {
        await fetchProducts(setProducts);
      }
    }

    fetchAllProducts();

    const cartItemsWithProducts = cartItems.map(cartItemId => {
      const product = products.find(product => product._id === cartItemId);
      if (product) {
        return product;
      }
      return null;
    });

    const validCartItemsWithProducts = cartItemsWithProducts.filter(item => item !== null);
    setCartWithProducts(validCartItemsWithProducts);
    setIsLoading(false);
  }, [cartItems, products]);

  return (
    <section>
      <h2>Carrito de Compra</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Products products={cartWithProducts} />
      )}
    </section>
  );
}

export default Cart;
