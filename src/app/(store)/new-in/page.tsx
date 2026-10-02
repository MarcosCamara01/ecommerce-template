import { Suspense } from "react";

import { getAllProducts } from "@/app/actions";
import { ProductsSkeleton } from "@/components/products";
import { CatalogListing } from "@/components/products/CatalogListing";
import {
  SectionCount,
  SectionHeading,
} from "@/components/products/SectionHeading";
import { getShopSectionSummaries } from "@/lib/catalog/sections";

export const metadata = {
  title: "New in | Ecommerce Template",
  description: "The whole catalogue, newest first.",
};

export default function NewInPage() {
  return (
    <section className="pb-24">
      <SectionHeading
        title="New in"
        count={
          <Suspense fallback={null}>
            <AllPieces />
          </Suspense>
        }
      />
      <Suspense fallback={<ProductsSkeleton items={8} />}>
        <AllProducts />
      </Suspense>
    </section>
  );
}

async function AllPieces() {
  const summaries = await getShopSectionSummaries();
  const count = summaries.find((summary) => summary.key === "new-in")?.count;
  return count === undefined ? null : <SectionCount count={count} />;
}

async function AllProducts() {
  const [products, sections] = await Promise.all([
    getAllProducts(),
    getShopSectionSummaries(),
  ]);

  if (products.length === 0) {
    return (
      <p className="border-t border-line py-24 text-muted">
        No products available yet. Check back later.
      </p>
    );
  }

  return <CatalogListing products={products} sections={sections} activeKey="new-in" />;
}
