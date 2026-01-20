"use client";

/** COMPONENTS */
import { GridProducts } from "../products/GridProducts";
import { ProductItem } from "../products/ProductItem";
import Link from "next/link";
/** FUNCTIONALITY */
import { useWishlist } from "@/hooks/wishlist";
/** TYPES */
import type { ProductWithVariants } from "@/schemas";

export const WishlistProducts = ({
  allProducts,
}: {
  allProducts: ProductWithVariants[];
}) => {
  const { items: wishlistProducts } = useWishlist();

  if (wishlistProducts && wishlistProducts.length > 0) {
    const products = allProducts.filter((product) =>
      wishlistProducts.some(
        (wishlistProduct) => wishlistProduct.productId === product.id
      )
    );

    return (
      <div className="pt-12">
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">YOUR WISHLIST</h2>
        <GridProducts className="grid-cols-auto-fill-110">
          {products.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </GridProducts>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-91px)] gap-2 px-4">
      <h1 className="mb-6 text-4xl font-bold">YOUR WISHLIST IS EMPTY</h1>
      <p className="mb-4 text-lg">
        When you have added something to your wishlist, it will appear here.
        Want to get started?
      </p>
      <Link
        className="flex font-medium items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-background-tertiary hover:border-[#454545]"
        href="/"
      >
        Start
      </Link>
    </div>
  );
};
