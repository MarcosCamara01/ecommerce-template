import { getRandomProducts } from "@/app/actions";
import { GridProducts } from "../products/GridProducts";
import { ProductItem } from "../products/ProductItem";
import { ProductsSkeleton } from "../products/ProductsSkeleton";
import { Suspense } from "react";

export const RandomProducts = async ({
  productIdToExclude,
  showTitle = true,
}: {
  productIdToExclude: number;
  showTitle?: boolean;
}) => {
  const randomProducts = await getRandomProducts(productIdToExclude);

  return (
    <>
      {showTitle && (
        <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">
          YOU MIGHT ALSO LIKE...
        </h2>
      )}
      <GridProducts className="grid-cols-auto-fill-110">
        {randomProducts.map((p) => (
          <ProductItem key={p.id} product={p} />
        ))}
      </GridProducts>
    </>
  );
};

export const SuspenseRandomProducts = async ({
  productIdToExclude,
  showTitle = true,
}: {
  productIdToExclude: number;
  showTitle?: boolean;
}) => {
  return (
    <Suspense
      fallback={
        <>
          {showTitle && (
            <h2 className="mt-24 mb-5 text-xl font-bold sm:text-2xl">
              YOU MIGHT ALSO LIKE...
            </h2>
          )}
          <ProductsSkeleton extraClassname={"colums-mobile"} items={6} />
        </>
      }
    >
      <RandomProducts
        productIdToExclude={productIdToExclude}
        showTitle={showTitle}
      />
    </Suspense>
  );
};
