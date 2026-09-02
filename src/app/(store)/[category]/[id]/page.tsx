import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  SingleProduct,
  SingleProductSkeleton,
  SuspenseRandomProducts,
} from "@/components/product";
import { getProduct } from "@/app/actions";
import { ProductCategoryZod } from "@/lib/db/drizzle/schema";
import { pickFirst } from "@/utils/pickFirst";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";
import { parsePositiveIntegerId } from "@/lib/routing/positive-integer-id";

type PageProps = {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const productId = parsePositiveIntegerId(id);

  if (productId === null) {
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
  params,
  searchParams,
}: {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
}) {
  const [{ id, category }, sp] = await Promise.all([params, searchParams]);
  const selectedVariantColor = pickFirst(sp, "variant");
  const productId = parsePositiveIntegerId(id);

  if (
    !ProductCategoryZod.safeParse(category).success ||
    productId === null
  ) {
    notFound();
  }

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
  return (
    <section className="pt-14">
      <Suspense fallback={<SingleProductSkeleton />}>
        <DynamicProductContent params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
