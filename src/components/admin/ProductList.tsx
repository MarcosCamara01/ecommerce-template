"use client";

import { ProductDocument, ProductState } from "@/types/types";
import { Schema } from "mongoose";
import { useState } from "react";
// import { updateProduct } from "@/app/admin/products/actions";
import ProductCard from "./ProductCard";

interface ProductListProps {
  initialProducts: string;
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const productsPlainObject: ProductDocument[] = JSON.parse(initialProducts);
  const [products, setProducts] = useState<ProductDocument[]>(productsPlainObject);
  const [filter, setFilter] = useState<ProductState | "all">("all");

  console.log(products)

  const filteredProducts = products.filter((product) => 
    filter === "all" ? true : product.state === filter
  );

  const handleStateChange = async (productId: Schema.Types.ObjectId, newState: ProductState) => {
    // try {
    //   const updatedProduct = await updateProduct(productId.toString(), { state: newState });
    //   if (updatedProduct) {
    //     setProducts(products.map(p => 
    //       p._id.toString() === productId.toString() ? updatedProduct : p
    //     ));
    //   }
    // } catch (error) {
    //   console.error("Error updating product:", error);
    // }
  };

  return (
    <div>
      <div className="mb-4">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as ProductState | "all")}
          className="border p-2 rounded"
        >
          <option value="all">All Products</option>
          {Object.values(ProductState).map((state) => (
            <option key={state} value={state}>
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-10">
        {filteredProducts.map((product) => (
          <ProductCard 
            key={product._id.toString()}
            product={product}
            onStateChange={handleStateChange}
          />
        ))}
      </div>
    </div>
  );
}