"use client";

import { Skeleton } from "../ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ProductImage } from "../products/item/Image";
import type { ProductVariant } from "@/schemas/ecommerce";

interface ProductImages {
  name: string;
  selectedVariant: ProductVariant | undefined;
}

export const ProductImages = ({ name, selectedVariant }: ProductImages) => {
  if (!selectedVariant || !selectedVariant.images) {
    return (
      <Skeleton className="w-full rounded-b-none aspect-[2/3] min-w-[250px] lg:aspect-[4/6] lg:min-w-[560px]" />
    );
  }

  return (
    <>
      <div className="flex lg:hidden">
        <Carousel
          className="w-full min-w-[250px] rounded-md overflow-hidden"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {selectedVariant.images.map((image, index) => (
              <CarouselItem key={index} className="pl-0">
                <ProductImage
                  image={image}
                  name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
                  width={384}
                  height={576}
                  priority={index === 0 ? true : false}
                  sizes="(max-width: 994px) 100vw,
                  (max-width: 1304px) 50vw,
                  (max-width: 1500px) 25vw,
                  33vw"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="lg:grid hidden grid-cols-2 gap-0.5 min-w-grid-img">
        {selectedVariant.images.map((image, index) => (
          <div
            className="inline-block w-full max-w-2xl mx-auto overflow-hidden rounded"
            key={index}
          >
            <ProductImage
              image={image}
              name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
              width={850}
              height={1275}
              priority={true}
              sizes="(max-width: 1024px) 100vw,
              (max-width: 1300px) 50vw,
              (max-width: 1536px) 33vw"
            />
          </div>
        ))}
      </div>
    </>
  );
};
