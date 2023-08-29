"use client"

import { useEffect } from "react";
import { Products } from "../components/Products";
import { useProductContext } from "@/helpers/ProductContext";
import { fetchProducts } from "@/helpers/fetchProducts";

export default function Home() {
  const { products, setProducts } = useProductContext();

  useEffect(() => {
    const getProducts = async () => {
      try {
        if (products.length === 0) {
          await fetchProducts(setProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    getProducts();
  }, []);

  return (
    <section className="section-products">
      <Products
        products={products}
      />
    </section>
  );
}