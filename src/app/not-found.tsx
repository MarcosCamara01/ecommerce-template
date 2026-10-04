import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { RailCard } from "@/components/products/RailCard";
import { buttonClass } from "@/components/ui/button-classes";
import { getSearchCatalog } from "@/lib/catalog/search-index";

export const metadata = {
  title: "Page not found | Ecommerce Template",
};

export default function NotFound() {
  return (
    <div data-error-page="" className="pb-12 lg:pb-24">
      <div className="flex flex-col gap-10 pt-2 lg:gap-16">
      <section className="relative flex flex-col items-start gap-[18px]">
        <div>
          <span
            aria-hidden="true"
            className="block font-display text-[200px] leading-[0.78] tracking-[-0.01em] lg:text-[min(480px,33vw)]"
          >
            404
          </span>
          <Suspense fallback={null}>
            <StrayPiece />
          </Suspense>
        </div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] lg:text-[40px]">
          Page not found
        </h1>
        <p className="max-w-[520px] text-[17px] opacity-90">
          This page moved or never existed. The rest of the store is right where
          you left it.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={buttonClass()}>
            Back to home
          </Link>
          <Link href="/search" className={buttonClass({ variant: "secondary" })}>
            Search products
          </Link>
        </div>
      </section>
      <Suspense fallback={null}>
        <NewIn />
      </Suspense>
      </div>
    </div>
  );
}

/** A tilted photo dropped over the big number. */
async function StrayPiece() {
  const [piece] = await getSearchCatalog();
  if (!piece) return null;
  return (
    <Image
      src={piece.img}
      alt=""
      width={240}
      height={320}
      sizes="(max-width: 1023px) 120px, 18vw"
      className="absolute left-[58%] top-2.5 aspect-[3/4] w-[120px] -rotate-[8deg] rounded-photo bg-photo object-cover shadow-[0_30px_70px_rgba(0,0,0,.25)] lg:left-[min(560px,39vw)] lg:top-5 lg:w-[min(260px,18vw)]"
    />
  );
}

async function NewIn() {
  const pieces = (await getSearchCatalog()).slice(0, 4);
  if (pieces.length === 0) return null;
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-[22px]">
      <h2 className="font-semibold">New in</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,44%),1fr))] gap-x-3 gap-y-5">
        {pieces.map((product) => (
          <RailCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
