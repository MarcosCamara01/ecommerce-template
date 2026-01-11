"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, useImperativeHandle, useState } from "react";

export type BasicInfoRef = {
  name: string;
  description: string;
  price: string;
  category: string;
  reset: () => void;
};

interface BasicInfoProps {
  errors?: Record<string, string[]>;
}

export const BasicInfo = forwardRef<BasicInfoRef, BasicInfoProps>(
  ({ errors }, ref) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");

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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
          />
          {errors?.name && (
            <p className="text-sm text-red-500">{errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description"
            className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
          />
          {errors?.description && (
            <p className="text-sm text-red-500">{errors.description[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
            {errors?.price && (
              <p className="text-sm text-red-500">{errors.price[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
            >
              <option value="">Select category</option>
              <option value="t-shirts">T-Shirts</option>
              <option value="pants">Pants</option>
              <option value="sweatshirts">Sweatshirts</option>
            </select>
            {errors?.category && (
              <p className="text-sm text-red-500">{errors.category[0]}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BasicInfo.displayName = "BasicInfo";
