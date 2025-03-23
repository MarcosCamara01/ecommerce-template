"use server";

import { createSSRClient } from "@/libs/supabase/server";
import type { EnrichedProduct } from "@/schemas/ecommerce";
import { productsWithVariantsQuery } from "@/schemas/ecommerce";

export const getAllProducts = async (): Promise<EnrichedProduct[]> => {
  try {
    const supabase = createSSRClient();
    const { data: products, error } = await supabase
      .from('products_items')
      .select(productsWithVariantsQuery);
      
    if (error) throw error;
    return products as EnrichedProduct[];
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    throw new Error("Error al obtener los productos");
  }
};

export const getCategoryProducts = async (category: string): Promise<EnrichedProduct[]> => {
  try {
    const supabase = createSSRClient();
    const { data: products, error } = await supabase
      .from('products_items')
      .select(productsWithVariantsQuery)
      .eq('category', category);
      
    if (error) throw error;
    return products as EnrichedProduct[];
  } catch (error) {
    console.error("Error obteniendo productos por categoría:", error);
    throw new Error("Error al obtener productos por categoría");
  }
};

export const getRandomProducts = async (productId: number): Promise<EnrichedProduct[]> => {
  const supabase = createSSRClient();
  const shuffleArray = (array: any[]) => {
    let shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  try {
    const { data: products, error } = await supabase
      .from('products_items')
      .select(productsWithVariantsQuery);
      
    if (error) throw error;
    
    const filteredProducts = products.filter(product => product.id !== productId);
    const randomProducts = shuffleArray(filteredProducts).slice(0, 6);
    
    return randomProducts as EnrichedProduct[];
  } catch (error) {
    console.error("Error obteniendo productos aleatorios:", error);
    throw new Error("Error al obtener productos aleatorios");
  }
};

export const getProduct = async (productId: number): Promise<EnrichedProduct | null> => {
  try {
    const supabase = createSSRClient();
    
    const { data: product, error } = await supabase
      .from('products_items')
      .select(productsWithVariantsQuery)
      .eq('id', productId)
      .single();
      
    if (error) throw error;
    return product as EnrichedProduct;
  } catch (error) {
    console.error("Error obteniendo producto específico:", error);
    return null;
  }
};
