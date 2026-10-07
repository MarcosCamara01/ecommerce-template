import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "@/components/ui/link";

import { getCategoryProducts } from "@/app/actions";
import { ProductsSkeleton } from "@/components/products";
import { CatalogListing } from "@/components/products/CatalogListing";
import {
  SectionCount,
  SectionHeading,
} from "@/components/products/SectionHeading";
import { buttonClass } from "@/components/ui/button-classes";
import { shopSections } from "@/constants/navigation";
import { getShopSectionSummaries } from "@/lib/catalog/sections";
import {
  type ProductCategory,
  ProductCategoryZod,
} from "@/lib/db/drizzle/schema";

interface Props {
  params: Promise<{
    category: string;
  }>;
}

export function generateStaticParams() {
  return ProductCategoryZod.options.map((category) => ({ category }));
}

const sectionFor = (category: ProductCategory) =>
  shopSections.find((section) => section.key === category)!;

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const parsedCategory = ProductCategoryZod.safeParse(category);

  if (!parsedCategory.success) {
    return {
      title: "Category | Ecommerce Template",
      description: "Browse the catalog by category.",
    };
  }

  const { label } = sectionFor(parsedCategory.data);

  return {
    title: `${label} | Ecommerce Template`,
    description: `${label} category at Ecommerce Template by Marcos Camara`,
  };
}

const CategoryPage = async ({ params }: Props) => {
  const { category } = await params;
  const parsedCategory = ProductCategoryZod.safeParse(category);

  // Call notFound() before Suspense so the response can still be HTTP 404.
  if (!parsedCategory.success) {
    notFound();
  }

  const section = sectionFor(parsedCategory.data);
  return (
    <section className="pb-24">
      <SectionHeading
        title={section.label}
        count={
          <Suspense fallback={null}>
            <SectionPieces category={parsedCategory.data} />
          </Suspense>
        }
      />
      <Suspense fallback={<ProductsSkeleton items={8} />}>
        <CategoryProducts category={parsedCategory.data} />
      </Suspense>
    </section>
  );
};

const SectionPieces = async ({ category }: { category: ProductCategory }) => {
  const summaries = await getShopSectionSummaries();
  const count = summaries.find((summary) => summary.key === category)?.count;
  return count === undefined ? null : <SectionCount count={count} />;
};

const CategoryProducts = async ({
  category,
}: {
  category: ProductCategory;
}) => {
  const [products, sections] = await Promise.all([
    getCategoryProducts(category),
    getShopSectionSummaries(),
  ]);
  const { label } = sectionFor(category);

  if (products.length === 0) {
    return (
      <div className="flex min-h-[45vh] max-w-xl flex-col items-start justify-center gap-4 border-t border-line pt-10">
        <h2 className="font-display text-5xl leading-[0.9]">
          No products available in {label}
        </h2>
        <p className="text-muted">
          This collection is empty right now. Browse the full catalog for other products.
        </p>
        <Link href="/new-in" className={buttonClass({ size: "sm" })}>
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <CatalogListing products={products} sections={sections} activeKey={category} />
  );
};

export default CategoryPage;
