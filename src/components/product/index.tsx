"use client";

import { ProductImages } from "@/components/product/Images";
import { useState } from "react";
import AddToCart from "../cart/addToCart";
import type { EnrichedProduct, ProductVariant } from "@/schemas/ecommerce";
import { DefaultInfo } from "./DefaultInfo";

interface SingleProduct {
  product: string;
}

export const SingleProduct = ({ product }: SingleProduct) => {
  const productPlainObject: EnrichedProduct = JSON.parse(product);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    productPlainObject.variants[0]
  );

  if (!product) {
    return <div>Produnct not found</div>;
  }

  return (
    <div className="flex flex-wrap justify-between gap-8">
      <div className="grow-999 basis-0">
        <ProductImages
          name={productPlainObject.name}
          selectedVariant={selectedVariant}
        />
      </div>

      <div className="sticky flex flex-col items-center justify-center w-full h-full gap-5 grow basis-600 top-8">
        <div className="w-full border border-solid rounded border-border-primary bg-background-secondary">
          <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary">
            <h1 className="text-base font-semibold">
              {productPlainObject.name}
            </h1>
            <span className="text-sm">{productPlainObject.price}€</span>
            <p className="text-sm">{productPlainObject.description}</p>
          </div>

          <AddToCart
            product={productPlainObject}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
          />
        </div>

        <DefaultInfo />
      </div>
    </div>
  );
};
