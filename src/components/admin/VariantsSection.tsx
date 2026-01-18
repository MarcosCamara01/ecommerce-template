"use client";

import { Button } from "@/components/ui/button";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { VariantForm, type VariantFormRef } from "./VariantForm";
import type { VariantFormData, VariantSubmitData } from "@/types/admin";

export type VariantsSectionRef = {
  getVariants: () => VariantSubmitData[];
  getImages: () => Record<string, File[]>;
  reset: () => void;
};

interface VariantsSectionProps {
  initialVariants?: VariantFormData[];
}

interface VariantState {
  key: number;
  data: VariantFormData;
}

export const VariantsSection = forwardRef<VariantsSectionRef, VariantsSectionProps>(
  ({ initialVariants }, ref) => {
  
  const createInitialState = (): VariantState[] => {
    if (initialVariants?.length) {
      return initialVariants.map((v, i) => ({
        key: i,
        data: v,
      }));
    }
    return [{ key: 0, data: { color: "", stripeId: "", sizes: [], images: [] } }];
  };

  const [variants, setVariants] = useState<VariantState[]>(createInitialState);
  const variantRefs = useRef<Map<number, VariantFormRef>>(new Map());
  const nextKey = useRef(initialVariants?.length || 1);

  // Capture current state from refs before reordering
  const captureCurrentState = () => {
    const newVariants = variants.map((variant) => {
      const variantRef = variantRefs.current.get(variant.key);
      if (variantRef) {
        const currentData = variantRef.getData();
        return {
          ...variant,
          data: {
            id: currentData.id,
            color: currentData.color,
            stripeId: currentData.stripe_id,
            sizes: currentData.sizes,
            images: currentData.existingImages,
          },
        };
      }
      return variant;
    });
    return newVariants;
  };

  const moveVariant = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= variants.length) return;
    
    // Capture current state before reordering
    const currentState = captureCurrentState();
    
    // Swap positions
    const newVariants = [...currentState];
    [newVariants[index], newVariants[newIndex]] = [newVariants[newIndex], newVariants[index]];
    setVariants(newVariants);
  };

  useImperativeHandle(ref, () => ({
    getVariants: () => {
      return variants.map((variant) => {
        const variantRef = variantRefs.current.get(variant.key);
        return (
          variantRef?.getData() || {
            color: "",
            stripe_id: "",
            sizes: [],
            imageCount: 0,
            existingImages: [],
            removedImages: [],
          }
        );
      });
    },
    getImages: () => {
      const images: Record<string, File[]> = {};
      variants.forEach((variant, index) => {
        const variantRef = variantRefs.current.get(variant.key);
        if (variantRef) {
          images[`variant_${index}`] = variantRef.getImages();
        }
      });
      return images;
    },
    reset: () => {
      variantRefs.current.forEach((r) => r.reset());
      setVariants(createInitialState());
      nextKey.current = initialVariants?.length || 1;
    },
  }));

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { key: nextKey.current++, data: { color: "", stripeId: "", sizes: [], images: [] } },
    ]);
  };

  const removeVariant = (key: number) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((v) => v.key !== key));
      variantRefs.current.delete(key);
    }
  };

  return (
    <div className="space-y-4">
      {variants.map((variant, index) => (
        <VariantForm
          key={variant.key}
          index={index}
          ref={(el) => {
            if (el) variantRefs.current.set(variant.key, el);
          }}
          onRemove={() => removeVariant(variant.key)}
          canRemove={variants.length > 1}
          initialData={variant.data}
          onMoveUp={index > 0 ? () => moveVariant(index, "up") : undefined}
          onMoveDown={index < variants.length - 1 ? () => moveVariant(index, "down") : undefined}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addVariant}
        className="w-full h-12 border-dashed border-2 border-border-secondary hover:border-white hover:bg-white/5 transition-colors text-color-secondary hover:text-white"
      >
        <FiPlus className="mr-2 h-4 w-4" />
        Add Another Variant
      </Button>
    </div>
  );
  }
);

VariantsSection.displayName = "VariantsSection";
