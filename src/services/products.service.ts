import { productsRepository } from "@/lib/db/drizzle/repositories";
import type {
  Product,
  ProductWithVariants,
  InsertProduct,
  InsertProductVariant,
  ProductCategory,
} from "@/lib/db/drizzle/schema";

export async function getAllProducts(): Promise<ProductWithVariants[]> {
  try {
    return await productsRepository.findAll();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(
  id: number,
): Promise<ProductWithVariants | null> {
  try {
    return await productsRepository.findById(id);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductsByCategory(
  category: string,
): Promise<ProductWithVariants[]> {
  try {
    return await productsRepository.findByCategory(category as ProductCategory);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

export async function createProduct(
  product: InsertProduct,
): Promise<Product | null> {
  try {
    return await productsRepository.create(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
}

export async function createProductWithVariants(
  product: InsertProduct,
  variants: Omit<InsertProductVariant, "productId">[],
): Promise<ProductWithVariants | null> {
  try {
    return await productsRepository.createWithVariants(product, variants);
  } catch (error) {
    console.error("Error creating product with variants:", error);
    return null;
  }
}

export async function updateProduct(
  id: number,
  product: Partial<InsertProduct>,
): Promise<Product | null> {
  try {
    return await productsRepository.update(id, product);
  } catch (error) {
    console.error("Error updating product:", error);
    return null;
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  try {
    return await productsRepository.delete(id);
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
}

export async function searchProductsInDB(
  query: string,
): Promise<ProductWithVariants[]> {
  try {
    return await productsRepository.search(query);
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

export async function getRandomProducts(
  limit: number = 4,
): Promise<ProductWithVariants[]> {
  try {
    return await productsRepository.findRandom(limit);
  } catch (error) {
    console.error("Error fetching random products:", error);
    return [];
  }
}
