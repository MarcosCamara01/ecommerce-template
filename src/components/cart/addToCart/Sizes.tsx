import { type ProductVariant, ProductSize } from "@/schemas/ecommerce";
import { cn } from "@/libs/utils";
import { useImperativeHandle, useState, forwardRef, Ref } from "react";

export type SizesRef = {
  selectedSize: ProductSize;
};

export const Sizes = forwardRef(
  ({ sizes }: { sizes: ProductVariant["sizes"] }, ref: Ref<SizesRef>) => {
    const [selectedSize, setSelectedSize] = useState<ProductSize>(sizes[0]);

    useImperativeHandle(ref, () => ({
      selectedSize,
    }));

    return (
      <div className="grid grid-cols-4 gap-2.5 justify-center">
        {sizes.map((size, index) => (
          <button
            key={index}
            type="button"
            className={cn(
              "flex items-center justify-center border border-solid border-border-primary px-1 py-1.5 bg-black rounded transition duration-150 ease hover:border-border-secondary text-13",
              {
                "bg-white text-black": selectedSize === size,
              }
            )}
            onClick={() => setSelectedSize(size)}
          >
            <span>{size}</span>
          </button>
        ))}
      </div>
    );
  }
);

Sizes.displayName = "Sizes";
