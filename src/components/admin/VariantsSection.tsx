"use client";

import { Button } from "@/components/ui/button";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { VariantForm, type VariantFormRef } from "./VariantForm";
import type { ProductSize } from "@/schemas";

export type VariantsSectionRef = {
  getVariants: () => Array<{
    color: string;
    stripe_id: string;
    sizes: ProductSize[];
    imageCount: number;
  }>;
  getImages: () => Record<string, File[]>;
  reset: () => void;
};

export const VariantsSection = forwardRef<VariantsSectionRef>((_, ref) => {
  const [variantIds, setVariantIds] = useState<number[]>([0]);
  const variantRefs = useRef<Map<number, VariantFormRef>>(new Map());
  const nextId = useRef(1);

  useImperativeHandle(ref, () => ({
    getVariants: () => {
      return variantIds.map((id) => {
        const variantRef = variantRefs.current.get(id);
        return (
          variantRef?.getData() || {
            color: "",
            stripe_id: "",
            sizes: [],
            imageCount: 0,
          }
        );
      });
    },
    getImages: () => {
      const images: Record<string, File[]> = {};
      variantIds.forEach((id, index) => {
        const variantRef = variantRefs.current.get(id);
        if (variantRef) {
          images[`variant_${index}`] = variantRef.getImages();
        }
      });
      return images;
    },
    reset: () => {
      variantRefs.current.forEach((ref) => ref.reset());
      setVariantIds([0]);
      nextId.current = 1;
    },
  }));

  const addVariant = () => {
    setVariantIds((prev) => [...prev, nextId.current++]);
  };

  const removeVariant = (id: number) => {
    if (variantIds.length > 1) {
      setVariantIds((prev) => prev.filter((v) => v !== id));
      variantRefs.current.delete(id);
    }
  };

  return (
    <div className="space-y-4">
      {variantIds.map((id, index) => (
        <VariantForm
          key={id}
          index={index}
          ref={(el) => {
            if (el) variantRefs.current.set(id, el);
          }}
          onRemove={() => removeVariant(id)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="w-full"
      >
        <FiPlus className="mr-2 h-4 w-4" />
        Add Variant
      </Button>
    </div>
  );
});

VariantsSection.displayName = "VariantsSection";
