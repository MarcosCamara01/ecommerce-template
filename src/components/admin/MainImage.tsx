"use client";

import { Button } from "@/components/ui/button";
import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  CATALOG_IMAGE_ACCEPT,
  CATALOG_IMAGE_HELP_TEXT,
  catalogImageFileErrors,
} from "@/lib/catalog-sync/image-file-contract";
import { readImagePreview } from "./image-preview";

export type MainImageRef = {
  file: File | null;
  hasNewImage: boolean;
  existingUrl: string | null;
  reset: () => void;
};

interface MainImageProps {
  errors?: Record<string, string[]>;
  initialImageUrl?: string;
  onFieldChange?: (field: string) => void;
}

export const MainImage = forwardRef<MainImageRef, MainImageProps>(
  ({ errors, initialImageUrl, onFieldChange }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
    const [hasNewImage, setHasNewImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileAttemptRef = useRef(0);
    const inputId = useId();
    const errorId = useId();
    const displayedError = localError ?? errors?.img?.[0];

    useImperativeHandle(ref, () => ({
      file,
      hasNewImage,
      existingUrl: !hasNewImage && preview ? preview : null,
      reset: () => {
        fileAttemptRef.current += 1;
        setFile(null);
        setPreview(initialImageUrl || null);
        setHasNewImage(false);
        setLocalError(null);
        if (inputRef.current) inputRef.current.value = "";
      },
    }));

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const selectedFile = input.files?.[0];
      const accepted = await processFile(selectedFile);
      if (accepted === false) input.value = "";
    };

    const processFile = async (selectedFile?: File) => {
      if (!selectedFile) return false;
      const attempt = ++fileAttemptRef.current;
      const [validationError] = await catalogImageFileErrors(selectedFile);
      if (attempt !== fileAttemptRef.current) return null;
      if (validationError) {
        setLocalError(validationError);
        return false;
      }
      let nextPreview: string;
      try {
        nextPreview = await readImagePreview(selectedFile);
      } catch {
        if (attempt !== fileAttemptRef.current) return null;
        setLocalError("Image preview could not be read");
        return false;
      }
      if (attempt !== fileAttemptRef.current) return null;
      setLocalError(null);
      setFile(selectedFile);
      setHasNewImage(true);
      onFieldChange?.("img");
      setPreview(nextPreview);
      return true;
    };

    const handleRemove = () => {
      fileAttemptRef.current += 1;
      setFile(null);
      setPreview(null);
      setHasNewImage(false);
      setLocalError(null);
      onFieldChange?.("img");
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
      void processFile(droppedFile);
    };

    return (
      <div className="space-y-3">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl transition-[border-color,background-color,transform] duration-200",
            isDragging
              ? "border-white bg-white/5 scale-[1.02]"
              : "border-border-secondary hover:border-color-tertiary",
            displayedError && "border-red-500",
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
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="shadow-lg"
                  >
                    <FiX className="h-4 w-4 mr-2" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
              <p className="text-center text-sm text-color-tertiary mt-4">
                {file?.name}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="p-4 rounded-full bg-bg-tertiary mb-4">
                <FiImage
                  className="h-8 w-8 text-color-tertiary"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm font-medium text-color-secondary mb-1">
                Drag and drop your image here
              </p>
              <p className="text-xs text-color-tertiary mb-4">
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
                <FiUpload className="h-4 w-4 mr-2" aria-hidden="true" />
                Choose File
              </Button>
              <input
                id={inputId}
                ref={inputRef}
                type="file"
                name="mainImagePicker"
                accept={CATALOG_IMAGE_ACCEPT}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Choose main image file"
                aria-invalid={Boolean(displayedError)}
                aria-describedby={displayedError ? errorId : undefined}
              />
            </div>
          )}
        </div>
        {displayedError && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-sm text-red-400 font-medium"
          >
            {displayedError}
          </p>
        )}
      </div>
    );
  },
);

MainImage.displayName = "MainImage";
