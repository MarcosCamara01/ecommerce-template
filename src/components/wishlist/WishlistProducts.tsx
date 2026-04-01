"use client";

import Link from "next/link";

import { useWishlistDetails } from "@/hooks/wishlist";
import { SVGLoadingIcon } from "@/components/ui/loader";

import { GridProducts } from "../products/GridProducts";
import { ProductItem } from "../products/ProductItem";

export const WishlistProducts = () => {
  const { items, isPending } = useWishlistDetails();

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-91px)]">
        <SVGLoadingIcon height={30} width={30} />
      </div>
    );
  }

  if (items.length > 0) {
    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLIST</h2>
        <GridProducts className="grid-cols-auto-fill-110">
          {items.map(({ id, product }) => (
            <ProductItem key={id} product={product} />
          ))}
        </GridProducts>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-91px)] w-full flex-col items-center justify-center gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to your wishlist, it will appear here.
        Want to get started?
      </p>
      <Link
        className="flex h-[40px] min-w-[160px] max-w-[160px] items-center justify-center rounded-md border border-solid border-[#2E2E2E] bg-[#0C0C0C] px-[10px] text-sm font-medium transition-all hover:border-[#454545] hover:bg-background-tertiary"
        href="/"
      >
        Start
      </Link>
    </div>
  );
};
