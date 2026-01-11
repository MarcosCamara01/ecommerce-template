"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forwardRef, useImperativeHandle, useState } from "react";
import { ProductSizeEnum, type ProductSize } from "@/schemas";
import { cn } from "@/lib/utils";

export type VariantSizesRef = {
  sizes: ProductSize[];
  reset: () => void;
};

export const VariantSizes = forwardRef<VariantSizesRef>((_, ref) => {
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>([]);

  useImperativeHandle(ref, () => ({
    sizes: selectedSizes,
    reset: () => setSelectedSizes([]),
  }));

  const toggleSize = (size: ProductSize) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <div className="space-y-2">
      <Label>Available Sizes</Label>
      <div className="flex flex-wrap gap-2">
        {ProductSizeEnum.options.map((size) => (
          <Button
            key={size}
            type="button"
            variant={selectedSizes.includes(size) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSize(size)}
            className={cn(
              "min-w-[40px]",
              selectedSizes.includes(size) && "bg-white text-black"
            )}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
});

VariantSizes.displayName = "VariantSizes";
