"use client"

import { Products } from "../components/Products";
import { useProductContext } from "@/hooks/ProductContext";

export default function Home() {
  const { products } = useProductContext();

  return (
    <section className="section-products">
      <Products
        products={products}
      />
    </section>
  );
}