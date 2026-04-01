"use client";

import { useRef } from "react";

import { useThrottleFn } from "ahooks";

import { useCartMutation } from "@/hooks/cart";
import {
  type ProductVariant,
  type ProductWithVariants,
} from "@/lib/db/drizzle/schema";

import { Button } from "@/components/ui/button";

import { Colors } from "./Colors";
import { Sizes, type SizesRef } from "./Sizes";

interface BaseAddToCartProps {
  product: ProductWithVariants;
  selectedVariant?: ProductVariant;
}

function useAddToCartAction(selectedVariant?: ProductVariant) {
  const { add: addToCart } = useCartMutation();
  const sizesRef = useRef<SizesRef>(null!);

  const { run: throttledAddToCart } = useThrottleFn(
    () => {
      if (!selectedVariant) return;

      addToCart({
        size: sizesRef.current.selectedSize,
        variantId: selectedVariant.id,
        stripeId: selectedVariant.stripeId,
      });
    },
    { wait: 300 },
  );

  return {
    sizesRef,
    throttledAddToCart,
    isDisabled: !selectedVariant,
  };
}

export function AddToCart({
  product,
  selectedVariant,
}: BaseAddToCartProps) {
  const { sizesRef, throttledAddToCart, isDisabled } =
    useAddToCartAction(selectedVariant);

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
          disabled={isDisabled}
          onClick={() => throttledAddToCart()}
          className="w-full rounded-none bg-background-secondary p-2 text-13 transition duration-150 ease hover:bg-background-tertiary"
        >
          Add to cart
        </Button>
      </div>
    </>
  );
}

export function MobileAddToCart({
  product,
  selectedVariant,
}: BaseAddToCartProps) {
  const { sizesRef, throttledAddToCart, isDisabled } =
    useAddToCartAction(selectedVariant);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Sizes
            ref={sizesRef}
            productSizes={selectedVariant?.sizes ?? []}
            compact
          />
        </div>
        <div className="flex-shrink-0">
          <Colors
            variants={product.variants}
            selectedVariantColor={selectedVariant?.color}
            compact
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="default"
        disabled={isDisabled}
        onClick={() => throttledAddToCart()}
        className="w-full rounded-md bg-white py-3 text-sm font-medium text-black transition-colors hover:bg-gray-100"
      >
        Add to cart
      </Button>
    </div>
  );
}
