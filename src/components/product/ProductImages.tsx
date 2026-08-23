/** COMPONENTS */
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "../products/ProductImage";
import { getBlurDataURL } from "@/lib/images/blur.server";
/** TYPES */
import type { Product, ProductVariant } from "@/lib/db/drizzle/schema";

interface ProductImagesProps {
  name: Product["name"];
  selectedVariant: ProductVariant;
}

const PRODUCT_IMAGE_SIZES =
  "(max-width: 1023px) 100vw, (max-width: 1279px) 30vw, (max-width: 1535px) 32vw, 34vw";

export const ProductImages = async ({
  name,
  selectedVariant,
}: ProductImagesProps) => {
  if (!selectedVariant || !selectedVariant.images) {
    return <Skeleton className="w-full rounded-b-none aspect-[2/3]" />;
  }

  const blurDataURLs = await Promise.all(
    selectedVariant.images.map((image) => getBlurDataURL(image)),
  );

  return (
    <div
      aria-label={`${name} ${selectedVariant.color} product images`}
      className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-lg lg:grid lg:grid-cols-2 lg:gap-1 lg:overflow-visible"
      role="region"
    >
      {selectedVariant.images.map((image, index) => (
        <div
          className="relative min-w-full snap-start overflow-hidden lg:min-w-0"
          key={`${image}-${index}`}
        >
          <ProductImage
            image={image}
            blurDataURL={blurDataURLs[index]}
            name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
            width={1200}
            height={1800}
            priority={index === 0}
            sizes={PRODUCT_IMAGE_SIZES}
          />
        </div>
      ))}
    </div>
  );
};
