"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { ProductSizeEnum, type ProductSize } from "@/schemas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type VariantSizesRef = {
  sizes: ProductSize[];
  reset: () => void;
  setSizes: (sizes: ProductSize[]) => void;
};

interface VariantSizesProps {
  initialSizes?: ProductSize[];
}

export const VariantSizes = forwardRef<VariantSizesRef, VariantSizesProps>(
  ({ initialSizes }, ref) => {
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>(initialSizes || []);

  useImperativeHandle(ref, () => ({
    sizes: selectedSizes,
    reset: () => setSelectedSizes(initialSizes || []),
    setSizes: (sizes: ProductSize[]) => setSelectedSizes(sizes),
  }));

  const toggleSize = (size: ProductSize) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-wrap gap-2">
        {ProductSizeEnum.options.map((size) => {
          const isSelected = selectedSizes.includes(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={cn(
                "min-w-[48px] h-10 px-3 text-sm font-medium rounded-md border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary focus:ring-white/30",
                isSelected
                  ? "border-white bg-white text-black shadow-sm"
                  : "border-border-secondary text-color-secondary hover:border-color-tertiary hover:bg-bg-tertiary"
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
      {selectedSizes.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-color-tertiary">Selected:</span>
          <div className="flex flex-wrap gap-1">
            {selectedSizes.map((size) => (
              <Badge key={size} variant="secondary" className="text-xs">
                {size}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  }
);

VariantSizes.displayName = "VariantSizes";
