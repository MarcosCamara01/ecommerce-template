"use client";

import { useRef } from "react";

import { useThrottleFn } from "ahooks";

import { useCartMutation } from "@/hooks/cart";
import {
  type ProductVariant,
  type ProductWithVariants,
} from "@/lib/db/drizzle/schema";

import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/useHydrated";

import { Colors } from "./Colors";
import { Sizes, type SizesRef } from "./Sizes";

interface BaseAddToCartProps {
  product: ProductWithVariants;
  selectedVariant?: ProductVariant;
}

function useAddToCartAction(selectedVariant?: ProductVariant) {
  const { add: addToCart, isAdding } = useCartMutation();
  const isHydrated = useHydrated();
  const sizesRef = useRef<SizesRef>(null!);

  const { run: throttledAddToCart } = useThrottleFn(
    () => {
      if (!selectedVariant) return;

      addToCart({
        size: sizesRef.current.selectedSize,
        variantId: selectedVariant.id,
      });
    },
    { wait: 300 },
  );

  return {
    sizesRef,
    throttledAddToCart,
    isDisabled: !isHydrated || !selectedVariant || isAdding,
    isHydrated,
    isAdding,
  };
}

export function AddToCart({
  product,
  selectedVariant,
}: BaseAddToCartProps) {
  const { sizesRef, throttledAddToCart, isDisabled, isHydrated, isAdding } =
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
          type="button"
          variant="default"
          disabled={!isHydrated || isDisabled}
          onClick={() => throttledAddToCart()}
          className="w-full rounded-none bg-background-secondary p-2 text-13 transition duration-150 ease hover:bg-background-tertiary"
        >
          {isAdding ? "Adding…" : "Add to cart"}
        </Button>
      </div>
    </>
  );
}

export function MobileAddToCart({
  product,
  selectedVariant,
}: BaseAddToCartProps) {
  const { sizesRef, throttledAddToCart, isDisabled, isHydrated, isAdding } =
    useAddToCartAction(selectedVariant);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5">
        <Sizes
          ref={sizesRef}
          productSizes={selectedVariant?.sizes ?? []}
          compact
        />
        <Colors
          variants={product.variants}
          selectedVariantColor={selectedVariant?.color}
          compact
        />
      </div>

      <Button
        type="button"
        variant="default"
        disabled={!isHydrated || isDisabled}
        onClick={() => throttledAddToCart()}
        className="w-full rounded-md bg-white py-3 text-sm font-medium text-black transition-colors hover:bg-gray-100"
      >
        {isAdding ? "Adding…" : "Add to cart"}
      </Button>
    </div>
  );
}
