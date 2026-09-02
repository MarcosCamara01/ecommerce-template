"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { forwardRef, useId, useImperativeHandle, useState, useRef } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  CATALOG_IMAGE_ACCEPT,
  CATALOG_IMAGE_HELP_TEXT,
  catalogImageFileErrors,
} from "@/lib/catalog-sync/image-file-contract";
import { pairImagePreviews } from "./image-preview";

type NewImage = {
  key: number;
  file: File;
  preview: string;
};

export type VariantImagesRef = {
  images: File[];
  existingImages: string[];
  removedExistingImages: string[];
  reset: () => void;
};

interface VariantImagesProps {
  initialImages?: string[];
  error?: string;
  onChange?: () => void;
}

export const VariantImages = forwardRef<VariantImagesRef, VariantImagesProps>(
  ({ initialImages, error, onChange }, ref) => {
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages || []);
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const processingGenerationRef = useRef(0);
  const processingQueueRef = useRef<Promise<void> | null>(null);
  const nextImageKeyRef = useRef(0);
  const inputId = useId();
  const errorId = useId();
  const displayedError = localError ?? error;
  const images = newImages.map(({ file }) => file);

  useImperativeHandle(ref, () => ({
    images,
    existingImages,
    removedExistingImages,
    reset: () => {
      processingGenerationRef.current += 1;
      processingQueueRef.current = null;
      setNewImages([]);
      setExistingImages(initialImages || []);
      setRemovedExistingImages([]);
      setLocalError(null);
      if (inputRef.current) inputRef.current.value = "";
    },
  }));

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = Array.from(input.files || []);
    await processFiles(files);
    input.value = "";
  };

  const processFilesNow = async (files: File[], generation: number) => {
    if (!files.length) return false;
    const validationError = (await Promise.all(
      files.map((file) => catalogImageFileErrors(file)),
    )).flat().at(0);
    if (generation !== processingGenerationRef.current) return null;
    if (validationError) {
      setLocalError(validationError);
      return false;
    }
    let selections: { file: File; preview: string }[];
    try {
      selections = await pairImagePreviews(files);
    } catch {
      if (generation !== processingGenerationRef.current) return null;
      setLocalError("Image preview could not be read");
      return false;
    }
    if (generation !== processingGenerationRef.current) return null;
    setLocalError(null);
    onChange?.();
    const additions = selections.map(({ file, preview }) => ({
      key: nextImageKeyRef.current++,
      file,
      preview,
    }));
    setNewImages((current) => [...current, ...additions]);
    return true;
  };

  const processFiles = (files: File[]) => {
    const generation = processingGenerationRef.current;
    const currentQueue = processingQueueRef.current ?? Promise.resolve();
    const pending = currentQueue.then(() =>
      processFilesNow(files, generation),
    );
    processingQueueRef.current = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  };

  const handleRemove = (index: number) => {
    onChange?.();
    setLocalError(null);
    setNewImages((current) => current.filter((_, i) => i !== index));
  };

  const handleRemoveExisting = (index: number) => {
    onChange?.();
    setLocalError(null);
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
    void processFiles(files);
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="space-y-3 pb-2">
      {/* Image Grid - Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2 pr-2">
          {existingImages.map((imageUrl, index) => (
            <div key={imageUrl} className="relative group">
              <Image
                src={imageUrl}
                alt={`Existing ${index + 1}`}
                width={100}
                height={150}
                className="rounded-lg object-cover aspect-[2/3] w-full shadow-sm"
              />
              <Button
                type="button"
                aria-label={`Remove existing variant image ${index + 1}`}
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity shadow-md z-10"
                onClick={() => handleRemoveExisting(index)}
              >
                <FiX className="h-3 w-3" aria-hidden="true" />
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
      {newImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2 pr-2">
          {newImages.map(({ key, preview }, index) => (
            <div key={key} className="relative group">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                width={100}
                height={150}
                className="rounded-lg object-cover aspect-[2/3] w-full shadow-sm"
              />
              <Button
                type="button"
                aria-label={`Remove new variant image ${index + 1}`}
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity shadow-md z-10"
                onClick={() => handleRemove(index)}
              >
                <FiX className="h-3 w-3" aria-hidden="true" />
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
          "border-2 border-dashed rounded-lg transition-[border-color,background-color] duration-200",
          isDragging
            ? "border-white bg-white/5"
            : "border-border-secondary hover:border-color-tertiary",
        )}
      >
        <div className="flex flex-col items-center justify-center py-6 px-4">
          <div className="p-2 rounded-full bg-bg-tertiary mb-2">
            <FiImage
              className="h-5 w-5 text-color-tertiary"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-color-tertiary text-center mb-2">
            Drag & drop images or click to browse
          </p>
          <p className="text-xs text-color-tertiary text-center mb-2">
            {CATALOG_IMAGE_HELP_TEXT}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            aria-controls={inputId}
            aria-invalid={Boolean(displayedError)}
            aria-describedby={displayedError ? errorId : undefined}
          >
            <FiUpload className="h-3 w-3 mr-1.5" aria-hidden="true" />
            Add Images
          </Button>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            name="variantImagesPicker"
            accept={CATALOG_IMAGE_ACCEPT}
            multiple
            onChange={handleFilesChange}
            className="hidden"
            aria-label="Choose variant image files"
            aria-invalid={Boolean(displayedError)}
            aria-describedby={displayedError ? errorId : undefined}
          />
        </div>
      </div>

      {/* Image Count */}
      {totalImages > 0 && (
        <p className="text-xs text-color-tertiary">
          {totalImages} image{totalImages !== 1 ? "s" : ""} total
          {existingImages.length > 0 && ` (${existingImages.length} existing)`}
          {newImages.length > 0 && ` (${newImages.length} new)`}
        </p>
      )}
      {displayedError && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm font-medium text-red-400"
        >
          {displayedError}
        </p>
      )}
    </div>
  );
  },
);

VariantImages.displayName = "VariantImages";
