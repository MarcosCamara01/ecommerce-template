/** COMPONENTS */
import Image from "next/image";
/** TYPES */
import type { Product, ProductVariant } from "@/lib/db/drizzle/schema";

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
  return (
    <Image
      width={width}
      height={height}
      src={image}
      alt={name}
      priority={priority}
      className="w-full max-w-img aspect-[2/3] brightness-90"
      sizes={sizes}
    />
  );
};
