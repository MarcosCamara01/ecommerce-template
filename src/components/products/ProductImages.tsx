"use client";

import { Skeleton } from "../ui/skeleton";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { Images } from "./Images";
import { VariantsDocument } from "@/types/types";

interface ProductImages {
    name: string;
    images: string[];
}

export const ProductImages = ({ name, images }: ProductImages) => {
    if (!images) {
        return (
            <Skeleton className="w-full rounded-b-none min-w-[800px] lg:aspect-[4/6] lg:min-w-[560px]" />
        );
    }

    return (
        <>
            <div className="flex justify-center items-center h-full w-full">
                <Carousel
                    className="w-full min-w-[250px] rounded-md overflow-hidden"
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                >
                    <CarouselContent>
                        {images.map((image: string, index: number) => (
                            <CarouselItem key={index} className="pl-0">
                                <Images
                                    image={[image]}
                                    name={`${name}: Image ${index + 1}`}
                                    width={600}
                                    height={384}
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

            {/* <div className="lg:grid hidden grid-cols-2 gap-0.5 min-w-grid-img">
                {images.map((image: string, index: number) => (
                    <div
                        className="inline-block w-full max-w-2xl mx-auto overflow-hidden rounded"
                        key={index}
                    >
                        <Images
                            image={[image]}
                            name={`${name} Image ${index + 1}`}
                            width={850}
                            height={1275}
                            priority={true}
                            sizes="(max-width: 1024px) 100vw,
              (max-width: 1300px) 50vw,
              (max-width: 1536px) 33vw"
                        />
                    </div>
                ))}
            </div> */}
        </>
    );
};
