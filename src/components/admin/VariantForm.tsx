"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { FiTrash2 } from "react-icons/fi";
import { VariantSizes, type VariantSizesRef } from "./VariantSizes";
import { VariantImages, type VariantImagesRef } from "./VariantImages";
import type { ProductSize } from "@/schemas";

export type VariantFormRef = {
  getData: () => {
    color: string;
    stripe_id: string;
    sizes: ProductSize[];
    imageCount: number;
  };
  getImages: () => File[];
  reset: () => void;
};

interface VariantFormProps {
  index: number;
  onRemove: () => void;
}

export const VariantForm = forwardRef<VariantFormRef, VariantFormProps>(
  ({ index, onRemove }, ref) => {
    const colorRef = useRef<HTMLInputElement>(null);
    const stripeIdRef = useRef<HTMLInputElement>(null);
    const sizesRef = useRef<VariantSizesRef>(null!);
    const imagesRef = useRef<VariantImagesRef>(null!);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        color: colorRef.current?.value || "",
        stripe_id: stripeIdRef.current?.value || "",
        sizes: sizesRef.current.sizes,
        imageCount: imagesRef.current.images.length,
      }),
      getImages: () => imagesRef.current.images,
      reset: () => {
        if (colorRef.current) colorRef.current.value = "";
        if (stripeIdRef.current) stripeIdRef.current.value = "";
        sizesRef.current.reset();
        imagesRef.current.reset();
      },
    }));

    return (
      <div className="border border-border-primary rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Variant {index + 1}</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`color-${index}`}>Color</Label>
            <Input
              id={`color-${index}`}
              ref={colorRef}
              placeholder="e.g., Black, White, Red"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`stripe-${index}`}>Stripe Product ID</Label>
            <Input
              id={`stripe-${index}`}
              ref={stripeIdRef}
              placeholder="price_xxx..."
            />
          </div>
        </div>

        <VariantSizes ref={sizesRef} />
        <VariantImages ref={imagesRef} />
      </div>
    );
  }
);

VariantForm.displayName = "VariantForm";
