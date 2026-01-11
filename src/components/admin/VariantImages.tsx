"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import Image from "next/image";

export type VariantImagesRef = {
  images: File[];
  reset: () => void;
};

export const VariantImages = forwardRef<VariantImagesRef>((_, ref) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    images,
    reset: () => {
      setImages([]);
      setPreviews([]);
      if (inputRef.current) inputRef.current.value = "";
    },
  }));

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages((prev) => [...prev, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Variant Images</Label>
      <div className="border-2 border-dashed border-border-primary rounded-lg p-4">
        {previews.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  width={100}
                  height={150}
                  className="rounded object-cover aspect-[2/3] w-full"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-5 w-5"
                  onClick={() => handleRemove(index)}
                >
                  <FiX className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <label className="flex flex-col items-center justify-center cursor-pointer py-4">
          <FiUpload className="h-6 w-6 text-color-tertiary mb-1" />
          <span className="text-xs text-color-tertiary">Add images</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
});

VariantImages.displayName = "VariantImages";
