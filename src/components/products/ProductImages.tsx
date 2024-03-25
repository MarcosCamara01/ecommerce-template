'use client';

import { Skeleton } from '../ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Images } from './Images';
import { VariantsDocument } from '@/types/types';

interface ProductImages {
  name: string;
  isMobile: boolean;
  imageNumber: number;
  selectedVariant: VariantsDocument | undefined;
}

export const ProductImages = ({ name, isMobile, imageNumber, selectedVariant }: ProductImages) => {
  if (!selectedVariant || !selectedVariant.images || isMobile === null) {
    return <Skeleton className={`w-full rounded-b-none ${isMobile ? "aspect-[2/3] min-w-[250px]" : imageNumber === 2 ? "aspect-[4/3] min-w-[560px]" : "aspect-[4/6] min-w-[560px]"}`} />
  }

  if (isMobile) {
    return (
      <div>
        <Carousel
          className="w-full min-w-[250px] rounded-md overflow-hidden"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {selectedVariant.images.map((image: string, index: number) => (
              <CarouselItem key={index} className='pl-0'>
                <Images
                  image={[image]}
                  name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
                  width={384}
                  height={576}
                  priority={index === 0 ? true : false}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel >
      </div>
    )
  } else {
    return (
      <div className='grid grid-cols-2 gap-0.5 min-w-grid-img'>
        {selectedVariant.images.map((image: string, index: number) => (
          <div className='inline-block w-full max-w-2xl mx-auto overflow-hidden rounded' key={index} >
            <Images
              image={[image]}
              name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
              width={850}
              height={1275}
              priority={true}
            />
          </div>
        ))}
      </div>
    )
  }
}