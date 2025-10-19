import { type ProductVariant, ProductSize } from "@/schemas/ecommerce";
import { cn } from "@/libs/utils";
import { useImperativeHandle, useState, forwardRef, Ref } from "react";

export type SizesRef = {
  selectedSize: ProductSize;
};

export const Sizes = forwardRef(
  (
    { productSizes }: { productSizes: ProductVariant["sizes"] },
    ref: Ref<SizesRef>
  ) => {
    const allSizes = Object.values(ProductSize);
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
      <div className="grid grid-cols-4 gap-2.5 justify-center">
        {allSizes.map((size) => {
          const isAvailable = availableSizes.has(size);
          return (
            <button
              key={size}
              type="button"
              disabled={!isAvailable}
              className={cn(
                "flex items-center justify-center border border-solid border-border-primary px-1 py-1.5 bg-black rounded transition duration-150 ease hover:border-border-secondary text-13 disabled:opacity-50 disabled:cursor-not-allowed",
                {
                  "bg-white text-black": selectedSize === size && isAvailable,
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
