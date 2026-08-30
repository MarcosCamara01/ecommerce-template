import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getCategoryProducts } from "@/app/actions";
import {
  ProductsSkeleton,
  GridProducts,
  ProductItem,
} from "@/components/products";
import {
  type ProductCategory,
  ProductCategoryZod,
} from "@/lib/db/drizzle/schema";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import Link from "next/link";

interface Props {
  params: Promise<{
    category: string;
  }>;
}

export function generateStaticParams() {
  return [
    { category: "t-shirts" },
    { category: "pants" },
    { category: "sweatshirts" },
  ];
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const parsedCategory = ProductCategoryZod.safeParse(category);

  if (!parsedCategory.success) {
    return {
      title: "Category | Ecommerce Template",
      description: "Browse the catalog by category.",
    };
  }

  const capitalizedCategory = capitalizeFirstLetter(parsedCategory.data);

  return {
    title: `${capitalizedCategory} | Ecommerce Template`,
    description: `${capitalizedCategory} category at Ecommerce Template by Marcos Camara`,
  };
}

const CategoryPage = async ({ params }: Props) => {
  const { category } = await params;
  const parsedCategory = ProductCategoryZod.safeParse(category);

  if (!parsedCategory.success) {
    notFound();
  }

  const categoryName = capitalizeFirstLetter(parsedCategory.data);

  return (
    <section className="pt-14">
      <h1 className="sr-only">{categoryName} products</h1>
      <Suspense fallback={<ProductsSkeleton items={6} />}>
        <CategoryProducts category={parsedCategory.data} />
      </Suspense>
    </section>
  );
};

const CategoryProducts = async ({
  category,
}: {
  category: ProductCategory;
}) => {
  const products = await getCategoryProducts(category);
  const categoryName = capitalizeFirstLetter(category);

  if (products.length === 0) {
    return (
      <div className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-2xl font-bold text-pretty">
          No products available in {categoryName}
        </h2>
        <p className="text-color-secondary">
          This collection is empty right now. Browse the full catalog for other products.
        </p>
        <Link
          href="/"
          className="rounded-md border border-border-primary px-5 py-2.5 text-sm font-medium transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <GridProducts>
      {products.map((product, index) => (
        <ProductItem key={product.id} product={product} priority={index === 0} />
      ))}
    </GridProducts>
  );
};

export default CategoryPage;
