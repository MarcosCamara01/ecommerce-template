"use server";

import { createSSRClient } from "@/libs/supabase/server";
import type { EnrichedProduct } from "@/schemas/ecommerce";
import { productsWithVariantsQuery } from "@/schemas/ecommerce";

export const getAllProducts = async (): Promise<EnrichedProduct[]> => {
  try {
    const supabase = createSSRClient();
    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .returns<EnrichedProduct[]>();

    if (error) throw error;

    return products;
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    throw new Error("Error al obtener los productos");
  }
};

export const getCategoryProducts = async (
  category: string
): Promise<EnrichedProduct[]> => {
  try {
    const supabase = createSSRClient();
    const { data: products, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .eq("category", category)
      .returns<EnrichedProduct[]>();

    if (error) throw error;

    return products;
  } catch (error) {
    console.error("Error obteniendo productos por categoría:", error);
    throw new Error("Error al obtener productos por categoría");
  }
};

export const getRandomProducts = async (
  productId: number
): Promise<EnrichedProduct[]> => {
  try {
    const supabase = createSSRClient();

    const { data: randomProducts, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .neq("id", productId)
      .order("random()")
      .limit(6)
      .returns<EnrichedProduct[]>();

    if (error) throw error;

    return randomProducts;
  } catch (error) {
    console.error("Error obteniendo productos aleatorios:", error);
    throw new Error("Error al obtener productos aleatorios");
  }
};

export const getProduct = async (
  productId: number
): Promise<EnrichedProduct | null> => {
  try {
    const supabase = createSSRClient();

    const { data: product, error } = await supabase
      .from("products_items")
      .select(productsWithVariantsQuery)
      .eq("id", productId)
      .returns<EnrichedProduct>();

    if (error) throw error;

    return product;
  } catch (error) {
    console.error("Error obteniendo producto específico:", error);
    throw new Error("Error al obtener el producto específico");
  }
};
