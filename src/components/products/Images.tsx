"use client";

import React, { useState } from "react";
import Image, { ImageLoader } from "next/image";
import { Skeleton } from "../ui/skeleton";

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
    const params = [
        "f_auto",
        "c_limit",
        "w_" + width,
        "q_" + (quality || "auto"),
    ];
    const normalizeSrc = (src: string) => (src[0] === "/" ? src.slice(1) : src);

    return `https://res.cloudinary.com/${
        process.env.CLOUDINARY_CLOUD_NAME
    }/image/upload/${params.join(",")}/${normalizeSrc(src)}`;
};

export const Images = ({
    image,
    name,
    width,
    height,
    priority,
    sizes,
}: {
    image: [string];
    name: string;
    width: number;
    height: number;
    priority: boolean;
    sizes: string;
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageLoadComplete = () => {
        setImageLoaded(true);
    };

    return (
        <div
            className={`flex justify-center items-center w-full h-full ${
                !imageLoaded ? "relative" : ""
            }`}
        >
            {/* Optional Cloudinary Loader (Commented Out) */}
            {/* <Image
          loader={cloudinaryLoader} // Use this loader for cloud-hosted images
          width={width}
          height={height}
          src={image[0]}
          alt={name}
          priority={priority}
          className="w-full max-w-img aspect-[2/3] brightness-90"
          onLoad={handleImageLoadComplete}
          sizes={sizes}
      /> */}
            {/* Image Element */}
            <Image
                width={width}
                height={height}
                src={image[0]}
                alt={name}
                priority={priority}
                className="brightness-90 object-contain" // Maintains aspect ratio and centers image
                onLoad={handleImageLoadComplete}
                // sizes={sizes} // Uncomment if dynamic sizes are needed
            />

            {/* Skeleton Placeholder */}
            <div
                className={`absolute inset-0 flex justify-center items-center bg-black ${
                    !imageLoaded ? "block" : "hidden"
                }`}
            >
                <Skeleton className="w-full aspect-[2/3] rounded-b-none" />
            </div>
        </div>
    );
};
