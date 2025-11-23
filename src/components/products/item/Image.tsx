"use client";

/** FUNCTIONALITY */
import { useState } from "react";
/** COMPONENTS */
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
/** TYPES */
import type { Product, ProductVariant } from "@/schemas";

interface ProductImageProps {
  image: ProductVariant["images"][number];
  name: Product["name"];
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
}
export const ProductImage = ({
  image,
  name,
  width,
  height,
  priority,
  sizes,
}: ProductImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative">
      <Image
        width={width}
        height={height}
        src={image}
        alt={name}
        priority={priority}
        className="w-full max-w-img aspect-[2/3] brightness-90"
        onLoad={() => setImageLoaded(true)}
        sizes={sizes}
      />
      <div
        className={
          !imageLoaded
            ? "absolute top-0 right-0 w-full aspect-[2/3] bg-background-primary"
            : "hidden"
        }
      >
        <Skeleton className="w-full aspect-[2/3] rounded-b-none" />
      </div>
    </div>
  );
};
