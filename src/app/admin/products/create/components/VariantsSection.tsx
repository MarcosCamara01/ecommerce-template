import { forwardRef, useRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { FiPlus } from "react-icons/fi";
import { VariantForm, type VariantFormRef } from "./VariantForm";

export interface VariantsSectionRef {
  getVariants: () => Array<{
    color: string;
    stripe_id: string;
    sizes: string[];
    imageCount: number;
  }>;
  getImages: () => Record<string, File[]>;
  reset: () => void;
}

export const VariantsSection = forwardRef<VariantsSectionRef>((_props, ref) => {
  const [variantCount, setVariantCount] = useState(1);
  const variantRefs = useRef<Map<number, VariantFormRef>>(new Map());

  const addVariant = () => {
    setVariantCount((prev) => prev + 1);
  };

  const removeVariant = (index: number) => {
    setVariantCount((prev) => prev - 1);
    variantRefs.current.delete(index);
  };

  useImperativeHandle(ref, () => ({
    getVariants: () => {
      const variants = [];
      for (let i = 0; i < variantCount; i++) {
        const variantRef = variantRefs.current.get(i);
        if (variantRef) {
          variants.push({
            color: variantRef.color,
            stripe_id: variantRef.stripe_id,
            sizes: variantRef.sizes,
            imageCount: variantRef.images.length,
          });
        }
      }
      return variants;
    },
    getImages: () => {
      const images: Record<string, File[]> = {};
      for (let i = 0; i < variantCount; i++) {
        const variantRef = variantRefs.current.get(i);
        if (variantRef) {
          images[`variant_${i}`] = variantRef.images;
        }
      }
      return images;
    },
    reset: () => {
      setVariantCount(1);
      variantRefs.current.forEach((ref) => ref.reset());
      variantRefs.current.clear();
    },
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variants</h3>
        <Button
          type="button"
          onClick={addVariant}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <FiPlus className="w-4 h-4" />
          Add Variant
        </Button>
      </div>

      <div className="space-y-3">
        {Array.from({ length: variantCount }).map((_, index) => (
          <VariantForm
            key={index}
            ref={(el) => {
              if (el) variantRefs.current.set(index, el);
            }}
            index={index}
            onRemove={() => removeVariant(index)}
            canRemove={variantCount > 1}
          />
        ))}
      </div>
    </div>
  );
});

VariantsSection.displayName = "VariantsSection";
