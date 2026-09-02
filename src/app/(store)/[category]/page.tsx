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

interface Props {
  params: Promise<{
    category: string;
  }>;
}

export function generateStaticParams() {
  return ProductCategoryZod.options.map((category) => ({ category }));
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

  // Call notFound() before Suspense so the response can still be HTTP 404.
  if (!parsedCategory.success) {
    notFound();
  }

  return (
    <section className="pt-14">
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

  return (
    <GridProducts>
      {products.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </GridProducts>
  );
};

export default CategoryPage;
