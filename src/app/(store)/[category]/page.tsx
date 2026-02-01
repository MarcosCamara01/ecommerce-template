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
import { Suspense } from "react";

interface Props {
  params: Promise<{
    category: string;
  }>;
}

/**
 * Generate static params for all product categories
 * This enables PPR subshells for each category
 */
export function generateStaticParams() {
  return [
    { category: "t-shirts" },
    { category: "pants" },
    { category: "sweatshirts" },
  ];
}

export async function generateMetadata({ params }: Props) {
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const { category } = await params;
  const capitalizedCategory = capitalizeFirstLetter(category);

  return {
    title: `${capitalizedCategory} | Ecommerce Template`,
    description: `${capitalizedCategory} category at e-commerce template made by Marcos Cámara`,
  };
}

async function DynamicCategoryContent({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CategoryProducts category={ProductCategoryZod.parse(category)} />;
}

const CategoryPage = async ({ params }: Props) => {
  return (
    <section className="pt-14">
      <Suspense fallback={<ProductsSkeleton items={6} />}>
        <DynamicCategoryContent params={params} />
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
