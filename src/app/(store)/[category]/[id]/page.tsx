import {
  SingleProduct,
  SingleProductSkeleton,
  SuspenseRandomProducts,
} from "@/components/product";
import { getAllProducts, getProduct } from "@/app/actions";
import { Suspense } from "react";
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
  const product = await getProduct(Number(id));

  const title = product?.name
    ? capitalizeFirstLetter(product?.name) + " |"
    : undefined;
  const description = product?.description ?? undefined;

  return {
    title: `${title} Ecommerce Template`,
    description: description,
  };
}

async function DynamicProductContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; category: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const selectedVariantColor = pickFirst(sp, "variant");

  return (
    <>
      <SingleProduct id={id} selectedVariantColor={selectedVariantColor} />
      <SuspenseRandomProducts productIdToExclude={Number(id)} />
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
