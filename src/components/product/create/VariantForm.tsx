import { forwardRef, useRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiTrash2 } from "react-icons/fi";
import { VariantSizes, type VariantSizesRef } from "./VariantSizes";
import { VariantImages, type VariantImagesRef } from "./VariantImages";

export interface VariantFormRef {
  color: string;
  stripe_id: string;
  sizes: string[];
  images: File[];
  reset: () => void;
}

interface VariantFormProps {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export const VariantForm = forwardRef<VariantFormRef, VariantFormProps>(
  ({ index, onRemove, canRemove }, ref) => {
    const colorRef = useRef<HTMLInputElement>(null);
    const stripeRef = useRef<HTMLInputElement>(null);
    const sizesRef = useRef<VariantSizesRef>(null!);
    const imagesRef = useRef<VariantImagesRef>(null!);

    useImperativeHandle(ref, () => ({
      get color() {
        return colorRef.current?.value || "";
      },
      get stripe_id() {
        return stripeRef.current?.value || "";
      },
      get sizes() {
        return sizesRef.current.sizes;
      },
      get images() {
        return imagesRef.current.images;
      },
      reset: () => {
        if (colorRef.current) colorRef.current.value = "";
        if (stripeRef.current) stripeRef.current.value = "";
        sizesRef.current.reset();
        imagesRef.current.reset();
      },
    }));

    return (
      <div className="border border-border-primary rounded-lg p-6 space-y-4 bg-background-secondary">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-base">Variant {index + 1}</h4>
          {canRemove && (
            <Button
              type="button"
              onClick={onRemove}
              variant="destructive"
              className="gap-2"
              size="sm"
            >
              <FiTrash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`color_${index}`}>Color</Label>
            <Input
              id={`color_${index}`}
              ref={colorRef}
              placeholder="e.g., Black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`stripe_${index}`}>Stripe ID</Label>
            <Input
              id={`stripe_${index}`}
              ref={stripeRef}
              placeholder="e.g., price_1234..."
              required
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
