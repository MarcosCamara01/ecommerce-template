"use client";

import { ProductDocument, ProductState, VariantsDocument } from "@/types/types";
import Link from "next/link";
import Image from "next/image";
import { Schema } from "mongoose";
import { useState } from "react";

interface ProductCardProps {
  product: ProductDocument;
  onStateChange: (productId: Schema.Types.ObjectId, newState: ProductState) => Promise<void>;
}

export default function ProductCard({ product, onStateChange }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const newState = e.target.value as ProductState;
      await onStateChange(product._id, newState);
    } catch (error) {
      console.error("Failed to update product state:", error);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.image.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="border rounded-lg shadow-sm">
      <div className="flex p-4 gap-4">
        {/* Product Images Carousel */}
        <div className="relative w-32 h-32 flex-shrink-0 group cursor-pointer" onClick={nextImage}>
          <div className="absolute bottom-1 right-1 bg-black/60 text-xs px-2 py-1 rounded-full">
            {currentImageIndex + 1}/{product.image.length}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p>${product.price.toFixed(2)}</p>
              <p>Category: {product.category}</p>
            </div>
            {/* <span className="px-3 py-1 rounded-full text-sm">
              {product.state}
            </span> */}
          </div>
          
          {/* Description */}
          <div className="mt-2">
            <p>Description:</p>
            <ul className="list-disc ml-4">
              {/* {product.description.map((desc, index) => (
                <li key={index} className="line-clamp-1">{desc}</li>
              ))} */}
            </ul>
          </div>

          {/* Sizes */}
          <div className="mt-2 flex gap-2 items-center">
            <span>Sizes:</span>
            <div className="flex gap-1">
              {product.sizes.map((size) => (
                <span key={size} className="text-xs px-2 py-1 rounded bg-slate-800">
                  {size}
                </span>
              ))}
            </div>
          </div>

          {/* Variants Summary */}
          <div className="mt-2">
            <p>
              Variants: {product.variants.length} | 
              Total Stock: {product.variants.reduce((sum, variant) => sum + variant.stock, 0)}
            </p>
          </div>
        </div>

        {/* Actions
        <div className="flex flex-col gap-2 ml-4">
          <select
            value={product.state}
            onChange={handleStateChange}
            className="border rounded px-2 py-1.5 text-sm hover:border-gray-400 transition-colors cursor-pointer"
          >
            {Object.values(ProductState).map((state) => (
              <option key={state} value={state}>
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </option>
            ))}
          </select>
        </div> */}
      </div>

      {/* Variants Detail */}
      <div className="border-t px-4 py-2">
        <p>Variants:</p>
        <div className="grid grid-cols-2 gap-2">
          {product.variants.map((variant: VariantsDocument) => (
            <div key={variant._id} className="p-2 rounded bg-slate-800">
              <p>{variant.name}</p>
              <p>SKU: {variant.sku}</p>
              <p>Color: {variant.color}</p>
              <p>Stock: {variant.stock}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Details */}
      <div className="border-t px-4 py-2 flex justify-between">
        <div>
          <span>Created: {new Date(product.createdAt).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>Updated: {new Date(product.updatedAt).toLocaleDateString()}</span>
        </div>
        <div>
          <span>{product.state}</span> 
        </div>
      </div>
    </div>
  );
}
