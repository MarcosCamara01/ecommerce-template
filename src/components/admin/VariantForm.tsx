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
import { forwardRef, useImperativeHandle, useRef } from "react";
import { FiTrash2, FiHelpCircle } from "react-icons/fi";
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
  canRemove?: boolean;
}

export const VariantForm = forwardRef<VariantFormRef, VariantFormProps>(
  ({ index, onRemove, canRemove = true }, ref) => {
    const colorRef = useRef<HTMLInputElement>(null);
    const stripeIdRef = useRef<HTMLInputElement>(null);
    const sizesRef = useRef<VariantSizesRef>(null!);
    const imagesRef = useRef<VariantImagesRef>(null!);

    useImperativeHandle(ref, () => ({
      getData: () => ({
        color: colorRef.current?.value || "",
        stripe_id: stripeIdRef.current?.value || "",
        sizes: sizesRef.current?.sizes || [],
        imageCount: imagesRef.current?.images?.length || 0,
      }),
      getImages: () => imagesRef.current?.images || [],
      reset: () => {
        if (colorRef.current) colorRef.current.value = "";
        if (stripeIdRef.current) stripeIdRef.current.value = "";
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
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiHelpCircle className="h-3.5 w-3.5 text-color-tertiary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p>The price ID from your Stripe dashboard (e.g., price_1234...)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id={`stripe-${index}`}
                ref={stripeIdRef}
                placeholder="price_xxx..."
                className="h-10 font-mono text-sm"
              />
            </div>
          </div>

          {/* Sizes and Images in Accordion */}
          <Accordion type="single" collapsible defaultValue="sizes" className="w-full">
            <AccordionItem value="sizes" className="border border-border-primary rounded-lg px-4 bg-bg-primary/50">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-medium text-color-secondary">Available Sizes</span>
              </AccordionTrigger>
              <AccordionContent>
                <VariantSizes ref={sizesRef} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="images" className="border border-border-primary rounded-lg px-4 mt-2 bg-bg-primary/50">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-sm font-medium text-color-secondary">Variant Images</span>
              </AccordionTrigger>
              <AccordionContent>
                <VariantImages ref={imagesRef} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
  }
);

VariantForm.displayName = "VariantForm";
