"use client";

/** FUNCTIONALITY */
import { useRef } from "react";
import { useThrottleFn } from "ahooks";
import { useCartMutation } from "@/hooks/cart";
/** COMPONENTS */
import { Button } from "@/components/ui/button";
import { Sizes, type SizesRef } from "./Sizes";
import { Colors } from "./Colors";
/** TYPES */
import {
  ProductWithVariantsSchema,
  type ProductVariant,
} from "@/schemas/ecommerce";

interface AddToCartProps {
  productJSON: string;
  selectedVariant?: ProductVariant;
}

export default function AddToCart({
  productJSON,
  selectedVariant,
}: AddToCartProps) {
  const { add: addToCart } = useCartMutation();

  const product = ProductWithVariantsSchema.parse(JSON.parse(productJSON));

  const sizesRef = useRef<SizesRef>(null!);

  const { run: throttledAddToCart } = useThrottleFn(
    () =>
      addToCart({
        size: sizesRef.current.selectedSize,
        variant_id: selectedVariant?.id ?? 0,
      }),
    {
      wait: 300,
    }
  );

  return (
    <>
      <div className="p-5">
        <Sizes ref={sizesRef} productSizes={selectedVariant?.sizes ?? []} />
        <Colors
          variants={product.variants}
          selectedVariantColor={selectedVariant?.color}
        />
      </div>

      <div className="border-t border-solid border-border-primary">
        <Button
          type="submit"
          variant="default"
          onClick={() => throttledAddToCart()}
          className="w-full rounded-none bg-background-secondary p-2 transition duration-150 text-13 ease hover:bg-background-tertiary"
        >
          Add to cart
        </Button>
      </div>
    </>
  );
}
