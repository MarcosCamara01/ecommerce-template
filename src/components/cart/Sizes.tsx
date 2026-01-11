"use client";

/** FUNCTIONALITY */
import { cn } from "@/lib/utils";
import { useImperativeHandle, useState, forwardRef, Ref } from "react";
/** TYPES */
import {
  type ProductVariant,
  ProductSizeEnum,
  type ProductSize,
} from "@/schemas";

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

    const [selectedSize, setSelectedSize] = useState<ProductSize>(
      productSizes[0]
    );

    useImperativeHandle(ref, () => ({
      selectedSize,
    }));

    const handleSizeClick = (size: ProductSize) => {
      if (availableSizes.has(size)) {
        setSelectedSize(size);
      }
    };

    return (
      <div
        className={cn("grid gap-2", {
          "grid-cols-4 gap-2.5 justify-center": !compact,
          "grid-cols-6 sm:grid-cols-8 gap-1.5": compact,
        })}
      >
        {ProductSizeEnum.options.map((size) => {
          const isAvailable = availableSizes.has(size);
          return (
            <button
              key={size}
              type="button"
              disabled={!isAvailable}
              className={cn(
                "flex items-center justify-center border border-solid border-border-primary disabled:opacity-50 disabled:cursor-not-allowed bg-background-primary rounded transition-colors hover:border-border-secondary",
                {
                  "bg-white text-black": selectedSize === size && isAvailable,
                  "px-1 py-1.5 text-xs": !compact,
                  "px-2 py-1 text-[10px]": compact,
                }
              )}
              onClick={() => handleSizeClick(size)}
            >
              <span>{size}</span>
            </button>
          );
        })}
      </div>
    );
  }
);

Sizes.displayName = "Sizes";
