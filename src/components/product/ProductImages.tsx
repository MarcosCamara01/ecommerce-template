/** COMPONENTS */
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { ProductImage } from "../products/ProductImage";
/** TYPES */
import type { Product, ProductVariant } from "@/lib/db/drizzle/schema";

interface ProductImagesProps {
  name: Product["name"];
  selectedVariant: ProductVariant;
}

const PRODUCT_DESKTOP_IMAGE_SIZES =
  "(max-width: 1023px) 100vw, (max-width: 1279px) 29vw, (max-width: 1535px) 31vw, 640px";

export const ProductImages = ({
  name,
  selectedVariant,
}: ProductImagesProps) => {
  if (!selectedVariant || !selectedVariant.images) {
    return <Skeleton className="w-full rounded-b-none aspect-[2/3]" />;
  }

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <Carousel
          className="w-full overflow-hidden rounded-lg"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-0">
            {selectedVariant.images.map((image, index) => (
              <CarouselItem key={index} className="pl-0">
                <div className="relative w-full">
                  <ProductImage
                    image={image}
                    name={`${name} ${selectedVariant.color} - Image ${
                      index + 1
                    }`}
                    width={1200}
                    height={1800}
                    priority={index === 0}
                    sizes="100vw"
                    quality={90}
                    unoptimized
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots className="absolute bottom-4 left-0 right-0" />
        </Carousel>
      </div>

      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-2 gap-1 rounded overflow-hidden">
        {selectedVariant.images.map((image, index) => (
          <div className="relative w-full overflow-hidden" key={index}>
            <ProductImage
              image={image}
              name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
              width={1200}
              height={1800}
              priority={index < 2}
              sizes={PRODUCT_DESKTOP_IMAGE_SIZES}
              quality={90}
              unoptimized
            />
          </div>
        ))}
      </div>
    </>
  );
};
