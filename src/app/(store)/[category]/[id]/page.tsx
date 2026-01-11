import {
  SingleProduct,
  SingleProductSkeleton,
  SuspenseRandomProducts,
} from "@/components/product";
import { getProduct } from "@/app/actions";
import { Suspense } from "react";
import { pickFirst } from "@/utils/pickFirst";
import { capitalizeFirstLetter } from "@/utils/capitalizeFirstLetter";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variant: string | undefined }>;
};

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

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const selectedVariantColor = pickFirst(sp, "variant");

  return (
    <section className="pt-14">
      <Suspense fallback={<SingleProductSkeleton />}>
        <SingleProduct id={id} selectedVariantColor={selectedVariantColor} />
      </Suspense>

      <SuspenseRandomProducts productIdToExclude={Number(id)} />
    </section>
  );
}
