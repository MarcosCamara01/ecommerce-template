"use client"

import { useEffect, useState } from "react"
import { Products } from "../components/Products"
import axios from "axios";

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await axios.get('/api/products');
      const data = response.data;
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products.', error);
    }
  }

  return (
    <section className="section-products">
      <Products 
        products={products}
      />
    </section>
  )
}
