import React from "react";
import { Skeleton } from "../ui/skeleton";

const ProductSkeleton = ({
  extraClassname,
  numberProducts,
}: {
  extraClassname: string;
  numberProducts: number;
}) => {
  const productSkeletons = Array.from(
    { length: numberProducts },
    (_, index) => (
      <div
        key={index}
        className={`flex justify-between border border-solid border-border-primary rounded-md overflow-hidden 
            ${extraClassname === "cart-ord-mobile" ? "flex-row sm:flex-col" : "flex-col"}`}
      >
        <Skeleton className="w-full aspect-[2/3] rounded-b-none" />
        <div className="flex justify-between flex-col gap-2.5 p-3.5">
          <Skeleton className="h-5 full" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
      </div>
    ),
  );

  return (
    <div
      className={`grid gap-x-3.5 gap-y-6 sm:gap-y-9 ${extraClassname === "colums-mobile" ? "grid-cols-auto-fill-110" : ""}
        ${extraClassname === "cart-ord-mobile" ? "grid-cols-1" : ""} sm:grid-cols-auto-fill-250`}
    >
      {productSkeletons}
    </div>
  );
};

export default ProductSkeleton;
