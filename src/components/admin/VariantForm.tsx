"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { FiTrash2, FiHelpCircle, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { VariantSizes, type VariantSizesRef } from "./VariantSizes";
import { VariantImages, type VariantImagesRef } from "./VariantImages";
import type { VariantFormData, VariantSubmitData } from "@/types/admin";

export type VariantFormRef = {
  getData: () => VariantSubmitData;
  getImages: () => File[];
  reset: () => void;
};

interface VariantFormProps {
  index: number;
  onRemove: () => void;
  canRemove?: boolean;
  initialData?: VariantFormData;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const VariantForm = forwardRef<VariantFormRef, VariantFormProps>(
  ({ index, onRemove, canRemove = true, initialData, onMoveUp, onMoveDown }, ref) => {
    const colorRef = useRef<HTMLInputElement>(null);
    const stripeIdRef = useRef<HTMLInputElement>(null);
    const sizesRef = useRef<VariantSizesRef>(null!);
    const imagesRef = useRef<VariantImagesRef>(null!);

    useEffect(() => {
      if (initialData) {
        if (colorRef.current) colorRef.current.value = initialData.color;
        if (stripeIdRef.current) stripeIdRef.current.value = initialData.stripeId;
      }
    }, [initialData]);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        id: initialData?.id,
        color: colorRef.current?.value || "",
        stripe_id: stripeIdRef.current?.value || "",
        sizes: sizesRef.current?.sizes || [],
        imageCount: imagesRef.current?.images?.length || 0,
        existingImages: imagesRef.current?.existingImages || [],
        removedImages: imagesRef.current?.removedExistingImages || [],
      }),
      getImages: () => imagesRef.current?.images || [],
      reset: () => {
        if (colorRef.current) colorRef.current.value = initialData?.color || "";
        if (stripeIdRef.current) stripeIdRef.current.value = initialData?.stripeId || "";
        sizesRef.current?.reset();
        imagesRef.current?.reset();
      },
    }));

    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 bg-bg-tertiary/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {index + 1}
              </Badge>
              <span className="font-medium text-sm text-color-primary">Variant</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Move buttons */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onMoveUp}
                      disabled={!onMoveUp}
                      className="h-8 w-8 text-color-secondary hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Move up</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onMoveDown}
                      disabled={!onMoveDown}
                      className="h-8 w-8 text-color-secondary hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Move down</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Delete button */}
              {canRemove && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove variant</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Color and Stripe ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`color-${index}`} className="text-sm font-medium text-color-secondary">
                Color
              </Label>
              <Input
                id={`color-${index}`}
                ref={colorRef}
                placeholder="e.g., Black, White, Red"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor={`stripe-${index}`} className="text-sm font-medium text-color-secondary">
                  Stripe Price ID
                  <span className="ml-1 text-xs text-color-tertiary font-normal">(optional)</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiHelpCircle className="h-3.5 w-3.5 text-color-tertiary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>Leave empty to auto-generate a Stripe product and price. Or enter an existing price ID from your Stripe dashboard (e.g., price_1234...)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id={`stripe-${index}`}
                ref={stripeIdRef}
                placeholder="Auto-generated if empty"
                className="h-10 font-mono text-sm"
              />
            </div>
          </div>

          {/* Sizes and Images in Accordion */}
          <Accordion type="multiple" defaultValue={["sizes", "images"]} className="w-full">
            <AccordionItem value="sizes" className="border border-border-primary rounded-lg px-4 bg-bg-primary/50">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-medium text-color-secondary">Available Sizes</span>
              </AccordionTrigger>
              <AccordionContent forceMount>
                <VariantSizes ref={sizesRef} initialSizes={initialData?.sizes} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="images" className="border border-border-primary rounded-lg px-4 mt-2 bg-bg-primary/50">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-medium text-color-secondary">Variant Images</span>
              </AccordionTrigger>
              <AccordionContent forceMount>
                <VariantImages ref={imagesRef} initialImages={initialData?.images} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  }
);

VariantForm.displayName = "VariantForm";
