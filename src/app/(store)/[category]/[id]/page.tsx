import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  SingleProduct,
  SingleProductSkeleton,
  SuspenseRandomProducts,
} from "@/components/product";
import { getAllProducts, getProduct } from "@/app/actions";
import { ProductCategoryZod } from "@/lib/db/drizzle/schema";
import { pickFirst } from "@/utils/pickFirst";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";

type PageProps = {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
};

export async function generateStaticParams() {
  const products = await getAllProducts();

  if (products.length === 0) {
    // Cache Components rejects an empty result. Use 0, not 1: product ids
    // are bigserial starting at 1, and productId <= 0 404s before Suspense.
    return [{ category: ProductCategoryZod.options[0], id: "0" }];
  }

  return products.map((product) => ({
    category: product.category,
    id: String(product.id),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return {
      title: "Product | Ecommerce Template",
      description: "Explore the latest product details at Ecommerce Template.",
    };
  }

  const product = await getProduct(productId);

  if (!product) {
    return {
      title: "Product not found | Ecommerce Template",
      description: "The requested product is not available.",
    };
  }

  return {
    title: `${capitalizeFirstLetter(product.name)} | Ecommerce Template`,
    description: product.description,
  };
}

async function DynamicProductContent({
  productId,
  category,
  searchParams,
}: {
  productId: number;
  category: string;
  searchParams: Promise<{ variant: string | undefined }>;
}) {
  const sp = await searchParams;
  const selectedVariantColor = pickFirst(sp, "variant");

  return (
    <>
      <SingleProduct
        id={productId}
        category={category}
        selectedVariantColor={selectedVariantColor}
      />
      <SuspenseRandomProducts productIdToExclude={productId} />
    </>
  );
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { id, category } = await params;
  const productId = Number(id);

  // URL-known checks must run before Suspense so missing routes can be HTTP 404.
  if (
    !ProductCategoryZod.safeParse(category).success ||
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    notFound();
  }

  return (
    <section className="pt-14">
      <Suspense fallback={<SingleProductSkeleton />}>
        <DynamicProductContent
          productId={productId}
          category={category}
          searchParams={searchParams}
        />
      </Suspense>
    </section>
  );
}
