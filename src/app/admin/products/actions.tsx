"use server";

import { connectDB } from "@/libs/mongodb";
import { Product } from "@/models/Products";
import { ProductDocument } from "@/types/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/auth";
import { Schema } from "mongoose";

export const getAllProducts = async (): Promise<ProductDocument[] | null> => {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions);
    if (!session?.user.isAdmin) {
      throw new Error("Unauthorized access");
    }

    await connectDB();
    const products: ProductDocument[] = await Product.find().lean();
    return products;
  } catch (error) {
    console.error("Error fetching all products:", error);
    return null;
  }
};

// export const createProduct = async (productData: CreateProductInput): Promise<ProductDocument> => {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user.isAdmin) {
//       throw new Error("Unauthorized access");
//     }

//     await connectDB();
//     const newProduct = new Product(productData);
//     await newProduct.save();
//     return newProduct;
//   } catch (error) {
//     console.error("Error creating product:", error);
//     throw new Error("Failed to create product");
//   }
// };

// export const updateProduct = async (
//   productId: string | Schema.Types.ObjectId, 
//   updateData: UpdateProductInput
// ): Promise<ProductDocument | null> => {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user.isAdmin) {
//       throw new Error("Unauthorized access");
//     }

//     await connectDB();
//     const updatedProduct = await Product.findByIdAndUpdate(
//       productId,
//       { $set: updateData },
//       { new: true }
//     );
    
//     if (!updatedProduct) {
//       throw new Error("Product not found");
//     }

//     return updatedProduct;
//   } catch (error) {
//     console.error("Error updating product:", error);
//     throw new Error("Failed to update product");
//   }
// };

export const deleteProduct = async (productId: string | Schema.Types.ObjectId): Promise<{ message: string }> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.isAdmin) {
      throw new Error("Unauthorized access");
    }

    await connectDB();
    const deletedProduct = await Product.findByIdAndDelete(productId);
    
    if (!deletedProduct) {
      throw new Error("Product not found");
    }

    return { message: "Product deleted successfully" };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
};

export const getProduct = async (productId: string | Schema.Types.ObjectId): Promise<ProductDocument | null> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.isAdmin) {
      throw new Error("Unauthorized access");
    }

    await connectDB();
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
};