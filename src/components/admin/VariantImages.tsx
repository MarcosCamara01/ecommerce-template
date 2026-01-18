"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { forwardRef, useImperativeHandle, useState, useRef } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type VariantImagesRef = {
  images: File[];
  existingImages: string[];
  removedExistingImages: string[];
  reset: () => void;
};

interface VariantImagesProps {
  initialImages?: string[];
}

export const VariantImages = forwardRef<VariantImagesRef, VariantImagesProps>(
  ({ initialImages }, ref) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages || []);
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    images,
    existingImages,
    removedExistingImages,
    reset: () => {
      setImages([]);
      setPreviews([]);
      setExistingImages(initialImages || []);
      setRemovedExistingImages([]);
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

  const handleRemoveExisting = (index: number) => {
    const imageToRemove = existingImages[index];
    setRemovedExistingImages((prev) => [...prev, imageToRemove]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
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

  const totalImages = existingImages.length + previews.length;

  return (
    <div className="space-y-3 pb-2">
      {/* Image Grid - Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2 pr-2">
          {existingImages.map((imageUrl, index) => (
            <div key={`existing-${index}`} className="relative group">
              <Image
                src={imageUrl}
                alt={`Existing ${index + 1}`}
                width={100}
                height={150}
                className="rounded-lg object-cover aspect-[2/3] w-full shadow-sm"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                onClick={() => handleRemoveExisting(index)}
              >
                <FiX className="h-3 w-3" />
              </Button>
              <Badge
                variant="outline"
                className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0 bg-green-500/20 border-green-500 text-green-400"
              >
                {index + 1}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Image Grid - New Images */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2 pr-2">
          {previews.map((preview, index) => (
            <div key={`new-${index}`} className="relative group">
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
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                onClick={() => handleRemove(index)}
              >
                <FiX className="h-3 w-3" />
              </Button>
              <Badge
                variant="secondary"
                className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0"
              >
                +{index + 1}
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
      {totalImages > 0 && (
        <p className="text-xs text-color-tertiary">
          {totalImages} image{totalImages !== 1 ? "s" : ""} total
          {existingImages.length > 0 && ` (${existingImages.length} existing)`}
          {images.length > 0 && ` (${images.length} new)`}
        </p>
      )}
    </div>
  );
  }
);

VariantImages.displayName = "VariantImages";
