"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type VariantImagesRef = {
  images: File[];
  reset: () => void;
};

export const VariantImages = forwardRef<VariantImagesRef>((_, ref) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    if (files.length > 0) {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      setImages((prev) => [...prev, ...imageFiles]);

      imageFiles.forEach((file) => {
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
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  return (
    <div className="space-y-3 pb-2">
      {/* Image Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                width={100}
                height={150}
                className="rounded-lg object-cover aspect-[2/3] w-full shadow-sm"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                onClick={() => handleRemove(index)}
              >
                <FiX className="h-3 w-3" />
              </Button>
              <Badge
                variant="secondary"
                className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0"
              >
                {index + 1}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg transition-all duration-200",
          isDragging
            ? "border-white bg-white/5"
            : "border-border-secondary hover:border-color-tertiary"
        )}
      >
        <label className="flex flex-col items-center justify-center cursor-pointer py-6 px-4">
          <div className="p-2 rounded-full bg-bg-tertiary mb-2">
            <FiImage className="h-5 w-5 text-color-tertiary" />
          </div>
          <p className="text-xs text-color-tertiary text-center mb-2">
            Drag & drop images or click to browse
          </p>
          <Button type="button" variant="outline" size="sm" asChild>
            <span>
              <FiUpload className="h-3 w-3 mr-1.5" />
              Add Images
            </span>
          </Button>
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

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-xs text-color-tertiary">
          {images.length} image{images.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
});

VariantImages.displayName = "VariantImages";
