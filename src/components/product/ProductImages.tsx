"use client";

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
import type { Product, ProductVariant } from "@/schemas";

interface ProductImagesProps {
  name: Product["name"];
  selectedVariant: ProductVariant;
}

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
                    width={800}
                    height={1200}
                    priority={index === 0}
                    sizes="100vw"
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
              width={850}
              height={1275}
              priority={index < 2}
              sizes="(max-width: 1280px) 30vw,
                     (max-width: 1536px) 25vw,
                     20vw"
            />
          </div>
        ))}
      </div>
    </>
  );
};
