/** COMPONENTS */
import Image from "next/image";
/** FUNCTIONALITY */
import { cn } from "@/lib/utils";
/** TYPES */
import type { Product, ProductVariant } from "@/lib/db/drizzle/schema";

interface ProductImageProps {
  image: ProductVariant["images"][number];
  name: Product["name"];
  width: number;
  height: number;
  sizes: string;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  className?: string;
}

export const ProductImage = ({
  image,
  name,
  width,
  height,
  priority,
  sizes,
  quality,
  unoptimized,
  className,
}: ProductImageProps) => {
  return (
    <Image
      width={width}
      height={height}
      src={image}
      alt={name}
      priority={priority}
      quality={quality}
      unoptimized={unoptimized}
      className={cn("block h-auto w-full aspect-[2/3] brightness-90", className)}
      sizes={sizes}
    />
  );
};
