import { forwardRef, useImperativeHandle, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiAlertCircle } from "react-icons/fi";

export interface BasicInfoRef {
  name: string;
  description: string;
  price: string;
  category: string;
  reset: () => void;
}

interface BasicInfoProps {
  errors?: Record<string, string[]>;
}

export const BasicInfo = forwardRef<BasicInfoRef, BasicInfoProps>(
  ({ errors }, ref) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const categoryRef = useRef<HTMLSelectElement>(null);

    useImperativeHandle(ref, () => ({
      get name() {
        return nameRef.current?.value || "";
      },
      get description() {
        return descriptionRef.current?.value || "";
      },
      get price() {
        return priceRef.current?.value || "";
      },
      get category() {
        return categoryRef.current?.value || "";
      },
      reset: () => {
        if (nameRef.current) nameRef.current.value = "";
        if (descriptionRef.current) descriptionRef.current.value = "";
        if (priceRef.current) priceRef.current.value = "";
        if (categoryRef.current) categoryRef.current.value = "";
      },
    }));

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            ref={nameRef}
            placeholder="Enter product name"
            required
          />
          {errors?.name && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <FiAlertCircle className="w-3 h-3" />
              {errors.name[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            ref={descriptionRef}
            placeholder="Enter product description"
            required
            rows={4}
            className="flex min-h-[100px] w-full rounded-md border border-border-primary bg-background-secondary px-3 py-2 text-sm placeholder:text-color-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-secondary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          {errors?.description && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <FiAlertCircle className="w-3 h-3" />
              {errors.description[0]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (€)</Label>
            <Input
              id="price"
              ref={priceRef}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
            {errors?.price && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" />
                {errors.price[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              ref={categoryRef}
              required
              className="flex h-10 w-full rounded-md border border-border-primary bg-background-secondary px-3 py-2 text-sm ring-offset-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a category</option>
              <option value="t-shirts">T-Shirts</option>
              <option value="pants">Pants</option>
              <option value="sweatshirts">Sweatshirt</option>
            </select>
            {errors?.category && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" />
                {errors.category[0]}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BasicInfo.displayName = "BasicInfo";
