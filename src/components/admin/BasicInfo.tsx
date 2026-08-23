"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { forwardRef, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/db/drizzle/schema";
import { STRIPE_EUR_MAX_CHARGE_CENTS } from "@/lib/stripe/amount-limits";
import { CATALOG_PRODUCT_NAME_MAX_LENGTH } from "@/lib/catalog-sync/input-validation";

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "t-shirts", label: "T-Shirts" },
  { value: "pants", label: "Pants" },
  { value: "sweatshirts", label: "Sweatshirts" },
];

export type BasicInfoRef = {
  name: string;
  description: string;
  price: string;
  category: ProductCategory | "";
  reset: () => void;
};

export interface BasicInfoInitialData {
  name?: string;
  description?: string;
  price?: number;
  category?: ProductCategory;
}

interface BasicInfoProps {
  errors?: Record<string, string[]>;
  initialData?: BasicInfoInitialData;
  onFieldChange?: (field: string) => void;
}

export const BasicInfo = forwardRef<BasicInfoRef, BasicInfoProps>(
  ({ errors, initialData, onFieldChange }, ref) => {
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(
      initialData?.description || "",
    );
    const [price, setPrice] = useState(initialData?.price?.toString() || "");
    const [category, setCategory] = useState<ProductCategory | "">(
      initialData?.category || "",
    );

    useImperativeHandle(ref, () => ({
      name,
      description,
      price,
      category,
      reset: () => {
        setName("");
        setDescription("");
        setPrice("");
        setCategory("");
      },
    }));

    return (
      <div className="space-y-5">
        {/* Product Name */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-sm font-medium text-color-secondary"
          >
            Product Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            maxLength={CATALOG_PRODUCT_NAME_MAX_LENGTH}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onFieldChange?.("name");
            }}
            aria-invalid={Boolean(errors?.name)}
            aria-describedby={errors?.name ? "name-error" : undefined}
            placeholder="Enter product name"
            className={cn(
              "h-11",
              errors?.name && "border-red-500 focus-visible:ring-red-500",
            )}
          />
          {errors?.name && (
            <p id="name-error" className="text-sm text-red-400 font-medium">{errors.name[0]}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-medium text-color-secondary"
          >
            Description <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onFieldChange?.("description");
            }}
            aria-invalid={Boolean(errors?.description)}
            aria-describedby={errors?.description ? "description-error" : undefined}
            placeholder="Describe your product in detail..."
            className={cn(
              "min-h-[120px] resize-none",
              errors?.description &&
                "border-red-500 focus-visible:ring-red-500",
            )}
          />
          {errors?.description && (
            <p id="description-error" className="text-sm text-red-400 font-medium">
              {errors.description[0]}
            </p>
          )}
        </div>

        {/* Price and Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Price */}
          <div className="space-y-2">
            <Label
              htmlFor="price"
              className="text-sm font-medium text-color-secondary"
            >
              Price (€) <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-color-tertiary">
                €
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                max={STRIPE_EUR_MAX_CHARGE_CENTS / 100}
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  onFieldChange?.("price");
                }}
                aria-invalid={Boolean(errors?.price)}
                aria-describedby={errors?.price ? "price-error" : undefined}
                placeholder="0.00"
                className={cn(
                  "h-11 pl-8",
                  errors?.price && "border-red-500 focus-visible:ring-red-500",
                )}
              />
            </div>
            {errors?.price && (
              <p id="price-error" className="text-sm text-red-400 font-medium">
                {errors.price[0]}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-sm font-medium text-color-secondary"
            >
              Category <span className="text-red-400">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as ProductCategory);
                onFieldChange?.("category");
              }}
            >
              <SelectTrigger
                id="category"
                aria-invalid={Boolean(errors?.category)}
                aria-describedby={errors?.category ? "category-error" : undefined}
                className={cn(
                  "h-11",
                  errors?.category &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.category && (
              <p id="category-error" className="text-sm text-red-400 font-medium">
                {errors.category[0]}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

BasicInfo.displayName = "BasicInfo";
