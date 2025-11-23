import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FiPlus, FiX } from "react-icons/fi";

export interface VariantImagesRef {
  images: File[];
  reset: () => void;
}

export const VariantImages = forwardRef<VariantImagesRef>((_props, ref) => {
  const [images, setImages] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  useImperativeHandle(ref, () => ({
    get images() {
      return images;
    },
    reset: () => {
      setImages([]);
      if (inputRef.current) inputRef.current.value = "";
    },
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Images</Label>
        <label htmlFor="variantImages" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-1"
          >
            <FiPlus className="w-4 h-4" />
            Add Images
          </Button>
        </label>
      </div>
      <input
        type="file"
        id="variantImages"
        ref={inputRef}
        multiple
        accept="image/*"
        onChange={(e) => addImages(e.target.files)}
        className="hidden"
      />
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, imgIndex) => (
            <div key={imgIndex} className="relative group">
              <img
                src={URL.createObjectURL(img)}
                alt={`Preview ${imgIndex}`}
                className="w-full h-20 object-cover rounded-md"
              />
              <Button
                type="button"
                onClick={() => removeImage(imgIndex)}
                variant="destructive"
                size="sm"
                className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

VariantImages.displayName = "VariantImages";
