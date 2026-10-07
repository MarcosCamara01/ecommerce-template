"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { PRODUCT_SIZES } from "@/constants/sizes";
import type { ProductSize } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type VariantSizesRef = {
  sizes: ProductSize[];
  reset: () => void;
  setSizes: (sizes: ProductSize[]) => void;
};

interface VariantSizesProps {
  initialSizes?: ProductSize[];
  error?: string;
  onChange?: () => void;
}

export const VariantSizes = forwardRef<VariantSizesRef, VariantSizesProps>(
  ({ initialSizes, error, onChange }, ref) => {
    const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>(
      initialSizes || [],
    );

    useImperativeHandle(ref, () => ({
      sizes: selectedSizes,
      reset: () => setSelectedSizes(initialSizes || []),
      setSizes: (sizes: ProductSize[]) => setSelectedSizes(sizes),
    }));

    const toggleSize = (size: ProductSize) => {
      onChange?.();
      setSelectedSizes((prev) =>
        prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
      );
    };

    const selectedSizeSet = new Set(selectedSizes);

    return (
      <div className="space-y-3 pb-2">
        <div className="flex flex-wrap gap-2">
          {PRODUCT_SIZES.map((size) => {
            const isSelected = selectedSizeSet.has(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSize(size)}
                className={cn(
                  "press h-10 w-[52px] rounded-pill border text-13 transition-[background-color,color,border-color,transform] duration-120",
                  isSelected
                    ? "border-fg bg-fg text-bg"
                    : "border-line text-fg hover:border-fg",
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
        {selectedSizes.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted">Selected:</span>
            <div className="flex flex-wrap gap-1">
              {selectedSizes.map((size) => (
                <Badge key={size} variant="secondary" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm font-medium text-err-fg">{error}</p>}
      </div>
    );
  },
);

VariantSizes.displayName = "VariantSizes";
