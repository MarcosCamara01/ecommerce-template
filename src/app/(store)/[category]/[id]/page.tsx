import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  SingleProduct,
  SingleProductSkeleton,
  SuspenseRandomProducts,
} from "@/components/product";
import { getAllProducts, getProduct } from "@/app/actions";
import { pickFirst } from "@/utils/pickFirst";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";

type PageProps = {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
};

export async function generateStaticParams() {
  const products = await getAllProducts();

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
  params,
  searchParams,
}: {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
}) {
  const [{ id, category }, sp] = await Promise.all([params, searchParams]);
  const selectedVariantColor = pickFirst(sp, "variant");
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
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
