"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import Image from "next/image";

export type MainImageRef = {
  file: File | null;
  reset: () => void;
};

interface MainImageProps {
  errors?: Record<string, string[]>;
}

export const MainImage = forwardRef<MainImageRef, MainImageProps>(
  ({ errors }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      file,
      reset: () => {
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      },
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
    };

    const handleRemove = () => {
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    };

    return (
      <div className="space-y-2">
        <Label>Main Image</Label>
        <div className="border-2 border-dashed border-border-primary rounded-lg p-6">
          {preview ? (
            <div className="relative w-full max-w-[200px] mx-auto">
              <Image
                src={preview}
                alt="Preview"
                width={200}
                height={300}
                className="rounded-lg object-cover aspect-[2/3]"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={handleRemove}
              >
                <FiX className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer py-8">
              <FiUpload className="h-10 w-10 text-color-tertiary mb-2" />
              <span className="text-sm text-color-tertiary">
                Click to upload main image
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
        {errors?.img && (
          <p className="text-sm text-red-500">{errors.img[0]}</p>
        )}
      </div>
    );
  }
);

MainImage.displayName = "MainImage";
