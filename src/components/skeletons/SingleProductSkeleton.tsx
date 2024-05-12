import React from "react";
import { Skeleton } from "../ui/skeleton";

const SingleProductSkeleton = () => (
  <div className="flex flex-wrap justify-between gap-8">
    <div className="grow-999 basis-0">
      <Skeleton className="w-full rounded-b-none aspect-[2/3] min-w-[250px] lg:aspect-[4/6] lg:min-w-[560px]" />
    </div>

    <div className="sticky flex flex-col items-center justify-center w-full h-full gap-5 grow basis-600 top-8">
      <div className="w-full border border-solid rounded border-border-primary bg-background-secondary">
        <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary">
          <h1>
            <Skeleton className="w-full h-6" />
          </h1>
          <span>
            <Skeleton className="h-5 w-[80px]" />
          </span>
          <div>
            <Skeleton className="w-full h-5" />
          </div>
        </div>

        <ButtonsSkeleton />
      </div>
    </div>
  </div>
);
export const ButtonsSkeleton = () => (
  <>
    <div className="p-5">
      <div className="grid grid-cols-4 gap-2.5 justify-center">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="w-full h-[33px]" />
        ))}
      </div>
      <div className="grid grid-cols-auto-fill-32 gap-2.5 mt-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="w-8 h-8 rounded" />
        ))}
      </div>
    </div>

    <div className="border-t border-solid border-border-primary">
      <button type="submit" className="w-full p-2">
        <Skeleton className="h-5 w-[100px] mx-auto" />
      </button>
    </div>
  </>
);

export default SingleProductSkeleton;
