import { Suspense } from "react";

import { getRandomProducts } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";

import { RailCard } from "../products/RailCard";

// Four pieces share one row from the smallest desktop width (1024px) up;
// a wider minimum left the fourth alone on a second row below 1232px.
const rail =
  "grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] lg:gap-4";

const RandomProducts = async ({
  productIdToExclude,
}: {
  productIdToExclude: number;
}) => {
  const randomProducts = (await getRandomProducts(productIdToExclude)).slice(0, 4);

  return (
    <div className={rail}>
      {randomProducts.map((product) => (
        <RailCard key={product.id} product={product} />
      ))}
    </div>
  );
};

/** "Wear it with": four other pieces under the product. */
export const SuspenseRandomProducts = ({
  productIdToExclude,
}: {
  productIdToExclude: number;
}) => {
  return (
    <section className="flex flex-col gap-7 pb-8 lg:pb-24">
      <h2 className="font-display text-[56px] leading-[0.85] lg:text-[min(120px,8.3vw)]">
        Wear it with
      </h2>
      <Suspense
        fallback={
          <div className={rail} aria-busy="true">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="flex flex-col gap-3">
                <Skeleton className="aspect-[3/4] rounded-photo" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            ))}
          </div>
        }
      >
        <RandomProducts productIdToExclude={productIdToExclude} />
      </Suspense>
    </section>
  );
};
