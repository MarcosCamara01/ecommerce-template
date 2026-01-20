"use client";

import { Button } from "@/components/ui/button";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type MainImageRef = {
  file: File | null;
  hasNewImage: boolean;
  existingUrl: string | null;
  reset: () => void;
};

interface MainImageProps {
  errors?: Record<string, string[]>;
  initialImageUrl?: string;
}

export const MainImage = forwardRef<MainImageRef, MainImageProps>(
  ({ errors, initialImageUrl }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
    const [hasNewImage, setHasNewImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      file,
      hasNewImage,
      existingUrl: !hasNewImage && preview ? preview : null,
      reset: () => {
        setFile(null);
        setPreview(initialImageUrl || null);
        setHasNewImage(false);
        if (inputRef.current) inputRef.current.value = "";
      },
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      processFile(selectedFile);
    };

    const processFile = (selectedFile?: File) => {
      if (selectedFile) {
        setFile(selectedFile);
        setHasNewImage(true);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
    };

    const handleRemove = () => {
      setFile(null);
      setPreview(null);
      setHasNewImage(false);
      if (inputRef.current) inputRef.current.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile?.type.startsWith("image/")) {
        processFile(droppedFile);
      }
    };

    return (
      <div className="space-y-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl transition-all duration-200",
            isDragging 
              ? "border-white bg-white/5 scale-[1.02]" 
              : "border-border-secondary hover:border-color-tertiary",
            errors?.img && "border-red-500"
          )}
        >
          {preview ? (
            <div className="p-6">
              <div className="relative w-full max-w-[240px] mx-auto group">
                <Image
                  src={preview}
                  alt="Preview"
                  width={240}
                  height={360}
                  className="rounded-lg object-cover aspect-[2/3] shadow-md"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="shadow-lg"
                  >
                    <FiX className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
              <p className="text-center text-sm text-color-tertiary mt-4">
                {file?.name}
              </p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer py-12 px-6">
              <div className="p-4 rounded-full bg-bg-tertiary mb-4">
                <FiImage className="h-8 w-8 text-color-tertiary" />
              </div>
              <p className="text-sm font-medium text-color-secondary mb-1">
                Drag and drop your image here
              </p>
              <p className="text-xs text-color-tertiary mb-4">
                or click to browse
              </p>
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <FiUpload className="h-4 w-4 mr-2" />
                  Choose File
                </span>
              </Button>
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
          <p className="text-sm text-red-400 font-medium">{errors.img[0]}</p>
        )}
      </div>
    );
  }
);

MainImage.displayName = "MainImage";
