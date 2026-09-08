import { Suspense } from "react";

import { getAllProducts } from "@/app/actions";
import { pickFirst, searchProducts } from "@/utils";
import { GridProducts, ProductItem } from "@/components/products";

interface SearchProps {
  searchParams: Promise<{ q: string | undefined }>;
}

async function SearchResults({ searchParams }: SearchProps) {
  const [products, params] = await Promise.all([getAllProducts(), searchParams]);

  const q = pickFirst(params, "q");
  const filteredProducts = searchProducts(products, q);

  return (
    <section className="pt-14">
      {filteredProducts.length > 0 ? (
        <GridProducts>
          {filteredProducts.map((product, index) => (
            <ProductItem key={product.id} product={product} priority={index === 0} />
          ))}
        </GridProducts>
      ) : (
        <h2 className="text-sm text-center">
          No products found for &quot;{q}&quot;
        </h2>
      )}
    </section>
  );
}

export default function Search(props: SearchProps) {
  return (
    <>
      <h1 className="sr-only">Search products</h1>
      <Suspense fallback={<section className="pt-14" />}>
        <SearchResults searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
