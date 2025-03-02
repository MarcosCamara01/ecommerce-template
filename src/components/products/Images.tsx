"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import { cloudinaryLoader } from "@/helpers/cloudinaryLoader";

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
    <div className={!imageLoaded ? "relative" : ""}>
      <Image
        loader={cloudinaryLoader}
        width={width}
        height={height}
        src={image[0]}
        alt={name}
        priority={priority}
        className="w-full max-w-img aspect-[2/3] brightness-90"
        onLoad={handleImageLoadComplete}
        sizes={sizes}
      />
      <div
        className={
          !imageLoaded
            ? "absolute top-0 right-0 w-full aspect-[2/3] bg-black"
            : "hidden"
        }
      >
        <Skeleton className="w-full aspect-[2/3] rounded-b-none" />
      </div>
    </div>
  );
};
