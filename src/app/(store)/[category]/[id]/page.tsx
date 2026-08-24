import { Suspense } from "react";
import { notFound } from "next/navigation";

import {
  SingleProduct,
  SingleProductSkeleton,
  SuspenseRandomProducts,
} from "@/components/product";
import { getProduct } from "@/app/actions";
import { pickFirst } from "@/utils/pickFirst";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";

type PageProps = {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return {
      title: "Producto | INCOFER",
      description: "Conocé los productos disponibles en INCOFER.",
    };
  }

  const product = await getProduct(productId);

  if (!product) {
    return {
      title: "Producto no encontrado | INCOFER",
      description: "El producto solicitado no está disponible.",
    };
  }

  return {
    title: `${capitalizeFirstLetter(product.name)} | INCOFER`,
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
