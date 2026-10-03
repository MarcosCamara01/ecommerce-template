import { Suspense } from "react";

import { getAllProducts } from "@/app/actions";
import { pickFirst, searchProducts } from "@/utils";
import { ProductItem, ProductsSkeleton } from "@/components/products";
import { RailCard } from "@/components/products/RailCard";
import { SearchPill } from "@/components/search/SearchPill";
import { fitDisplaySize } from "@/lib/display-type";

interface SearchProps {
  searchParams: Promise<{ q: string | undefined }>;
}

const grid =
  "grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-[repeat(auto-fill,minmax(min(300px,44%),1fr))]";

async function SearchResults({ searchParams }: SearchProps) {
  const [products, params] = await Promise.all([getAllProducts(), searchParams]);

  const q = pickFirst(params, "q")?.trim() ?? "";
  const filteredProducts = searchProducts(products, q);
  const title = q ? `“${q}”` : "Search";
  const titleStyle = {
    "--title-m": fitDisplaySize(title, { maxPx: 120, budgetPx: 340, vwBudget: 88 }),
    "--title-d": fitDisplaySize(title, { maxPx: 240, budgetPx: 1300, vwBudget: 90 }),
  } as React.CSSProperties;

  return (
    <>
      <section data-search-page="" className="flex flex-col gap-5 pb-6 pt-3 lg:pt-12">
        <span className="text-13 text-muted">Search results</span>
        <h1
          style={titleStyle}
          className="font-display text-[length:var(--title-m)] leading-[0.82] [overflow-wrap:anywhere] lg:text-[length:var(--title-d)]"
        >
          {title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <SearchPill query={q} />
          <span className="text-sm text-muted" aria-live="polite">
            {filteredProducts.length === 0
              ? "No matches"
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"}`}
          </span>
        </div>
      </section>

      {filteredProducts.length > 0 ? (
        <section aria-label="Results" className={`${grid} pb-24`}>
          {filteredProducts.map((product, index) => (
            <ProductItem key={product.id} product={product} priority={index < 2} />
          ))}
        </section>
      ) : (
        <section className="flex flex-col gap-7 pb-24">
          <div className="flex max-w-[900px] flex-col gap-4">
            <h2 className="font-display text-[56px] leading-[0.85] lg:text-[min(112px,7.8vw)]">
              Nothing matches yet
            </h2>
            <p className="text-lg">
              No products found for “{q}”. Check the spelling, or start with
              what&apos;s new.
            </p>
          </div>
          <div className={grid}>
            {products
              .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
              .slice(0, 4)
              .map((product) => (
                <RailCard key={product.id} product={product} />
              ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function Search(props: SearchProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 pt-12">
          <ProductsSkeleton items={8} />
        </div>
      }
    >
      <SearchResults searchParams={props.searchParams} />
    </Suspense>
  );
}
