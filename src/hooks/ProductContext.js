"use client"

import axios from 'axios';
import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const { data: session, status } = useSession()
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (products.length === 0) {
        try {
          const response = await axios.get('/api/products');
          const data = response.data;
          setProducts(data);
          return data;
        } catch (error) {
          console.error('Failed to fetch products.', error);
          throw error;
        }
      }
    };

    fetchProducts();
  }, [status, session]);

  return (
    <ProductContext.Provider value={{ products, setProducts }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  return useContext(ProductContext);
};