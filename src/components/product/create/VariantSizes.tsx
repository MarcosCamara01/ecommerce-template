import { forwardRef, useImperativeHandle, useState } from "react";
import { ProductSizeEnum, type ProductSize } from "@/schemas/ecommerce";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MdCheckCircle } from "react-icons/md";

export interface VariantSizesRef {
  sizes: ProductSize[];
  reset: () => void;
}

export const VariantSizes = forwardRef<VariantSizesRef>((_props, ref) => {
  const [sizes, setSizes] = useState<ProductSize[]>([]);

  const toggleSize = (size: ProductSize) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  useImperativeHandle(ref, () => ({
    get sizes() {
      return sizes;
    },
    reset: () => {
      setSizes([]);
    },
  }));

  return (
    <div className="space-y-3">
      <Label>Sizes</Label>
      <div className="flex flex-wrap gap-2">
        {ProductSizeEnum.options.map((size) => {
          const isSelected = sizes.includes(size);
          return (
            <Button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="w-12 relative group"
            >
              {size}
              {isSelected && (
                <MdCheckCircle className="absolute -top-2 -right-2 w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
});

VariantSizes.displayName = "VariantSizes";
