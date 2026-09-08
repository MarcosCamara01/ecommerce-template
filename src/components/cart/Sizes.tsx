"use client";

/** FUNCTIONALITY */
import { cn } from "@/lib/utils";
import { useImperativeHandle, useState, forwardRef, Ref } from "react";
/** TYPES */
import {
  type ProductVariant,
  ProductSizeZod,
  type ProductSize,
} from "@/lib/db/drizzle/schema";

export type SizesRef = {
  selectedSize: ProductSize;
};

interface SizesProps {
  productSizes: ProductVariant["sizes"];
  compact?: boolean;
}

export const Sizes = forwardRef(
  ({ productSizes, compact = false }: SizesProps, ref: Ref<SizesRef>) => {
    const availableSizes = new Set(productSizes);

    // Only what the user actually picked is state. Switching colour swaps
    // `productSizes` without remounting, so copying the prop into state would
    // keep a size the new variant does not stock — and the ref below is what
    // AddToCart submits.
    const [pickedSize, setPickedSize] = useState<ProductSize | null>(null);
    const activeSize =
      pickedSize !== null && availableSizes.has(pickedSize)
        ? pickedSize
        : productSizes[0];

    useImperativeHandle(ref, () => ({
      selectedSize: activeSize,
    }));

    const handleSizeClick = (size: ProductSize) => {
      if (availableSizes.has(size)) {
        setPickedSize(size);
      }
    };

    return (
      <div
        className={cn("grid gap-2", {
          "grid-cols-4 gap-2.5 justify-center": !compact,
          "flex flex-wrap gap-2": compact,
        })}
      >
        {ProductSizeZod.options.map((size) => {
          const isAvailable = availableSizes.has(size);
          return (
            <button
              key={size}
              type="button"
              disabled={!isAvailable}
              className={cn(
                "flex items-center justify-center border border-solid border-border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-background-primary rounded transition-colors hover:border-border-secondary",
                {
                  "bg-white text-black": activeSize === size && isAvailable,
                  "px-1 py-1.5 text-xs": !compact,
                  "min-w-[3rem] px-2.5 py-1.5 text-[10px]": compact,
                },
              )}
              onClick={() => handleSizeClick(size)}
            >
              <span>{size}</span>
            </button>
          );
        })}
      </div>
    );
  },
);

Sizes.displayName = "Sizes";
