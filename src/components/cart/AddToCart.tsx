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
  productWithVariantsSchema,
  type ProductVariant,
} from "@/lib/db/drizzle/schema";

interface AddToCartProps {
  productJSON: string;
  selectedVariant?: ProductVariant;
  isMobileBar?: boolean;
}

export function AddToCart({
  productJSON,
  selectedVariant,
  isMobileBar = false,
}: AddToCartProps) {
  const { add: addToCart } = useCartMutation();
  const product = productWithVariantsSchema.parse(JSON.parse(productJSON));
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

  if (isMobileBar) {
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
          disabled={!selectedVariant}
          onClick={() => throttledAddToCart()}
          className="w-full py-3 text-sm font-medium bg-white text-black hover:bg-gray-100 transition-colors rounded-md"
        >
          Add to cart
        </Button>
      </div>
    );
  }

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
          disabled={!selectedVariant}
          onClick={() => throttledAddToCart()}
          className="w-full rounded-none bg-background-secondary p-2 transition duration-150 text-13 ease hover:bg-background-tertiary"
        >
          Add to cart
        </Button>
      </div>
    </>
  );
}
