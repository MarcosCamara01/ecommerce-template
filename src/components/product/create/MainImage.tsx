import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FiUploadCloud, FiX } from "react-icons/fi";

export interface MainImageRef {
  file: File | null;
  reset: () => void;
}

interface MainImageProps {
  errors?: Record<string, string[]>;
}

export const MainImage = forwardRef<MainImageRef, MainImageProps>(
  ({ errors }, ref) => {
    const [preview, setPreview] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      }
    };

    useImperativeHandle(ref, () => ({
      get file() {
        return file;
      },
      reset: () => {
        setFile(null);
        setPreview("");
        if (inputRef.current) inputRef.current.value = "";
      },
    }));

    return (
      <div className="space-y-2">
        <Label htmlFor="mainImage">Main Image</Label>
        <div className="relative">
          <input
            type="file"
            id="mainImage"
            ref={inputRef}
            accept="image/*"
            onChange={handleChange}
            required
            className="hidden"
          />
          {!preview ? (
            <label
              htmlFor="mainImage"
              className="flex items-center justify-center w-full h-48 border-2 border-dashed border-border-secondary rounded-lg cursor-pointer hover:border-border-primary transition-colors"
            >
              <div className="text-center">
                <FiUploadCloud className="w-8 h-8 mx-auto mb-2 text-color-tertiary" />
                <p className="text-sm text-color-tertiary">
                  Click to upload or drag image
                </p>
              </div>
            </label>
          ) : (
            <div className="relative group">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-8 h-8 p-0"
              >
                <FiX className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        {errors?.img && <p className="text-xs text-red-500">{errors.img[0]}</p>}
      </div>
    );
  }
);

MainImage.displayName = "MainImage";
