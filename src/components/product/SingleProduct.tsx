import { notFound, redirect } from "next/navigation";

import { getProduct } from "@/app/actions";
import type { ProductVariant } from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import { AddToCart, MobileAddToCart } from "../cart/AddToCart";

import { EditProductButton } from "./EditProductButton";
import { ProductImages } from "./ProductImages";
import { ProductInfo } from "./ProductInfo";

interface SingleProductProps {
  id: number;
  category: string;
  selectedVariantColor?: ProductVariant["color"];
}

export const SingleProduct = async ({
  id,
  category,
  selectedVariantColor,
}: SingleProductProps) => {
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  if (product.category !== category) {
    const variantQuery = selectedVariantColor
      ? `?variant=${encodeURIComponent(selectedVariantColor)}`
      : "";

    redirect(`/${product.category}/${id}${variantQuery}`);
  }

  if (product.variants.length === 0) {
    notFound();
  }

  const selectedVariant = product.variants.find(
    (variant) => variant.color === selectedVariantColor,
  );

  if (!selectedVariant) {
    redirect(
      `/${product.category}/${id}?variant=${encodeURIComponent(product.variants[0].color)}`,
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:gap-6 xl:gap-8">
        <div className="w-full lg:w-[60%] xl:w-[65%] 2xl:w-[70%]">
          <ProductImages name={product.name} selectedVariant={selectedVariant} />
        </div>

        <div className="hidden lg:block lg:w-[40%] xl:w-[35%] 2xl:w-[30%]">
          <div className="sticky top-20 flex flex-col gap-5">
            <div className="w-full overflow-hidden rounded border border-solid border-border-primary bg-background-secondary">
              <div className="flex flex-col justify-between gap-3 border-b border-solid border-border-primary p-5">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-lg font-semibold">{product.name}</h1>
                  <EditProductButton productId={product.id} />
                </div>
                <span className="text-base font-medium">
                  {formatPriceFromEuros(product.price)}
                </span>
                <p className="line-clamp-5 break-all text-sm text-color-secondary">
                  {product.description}
                </p>
              </div>

              <AddToCart product={product} selectedVariant={selectedVariant} />
            </div>

            <ProductInfo />
          </div>
        </div>
      </div>

      <div className="mt-6 px-2 xs:px-4 sm:px-6 md:px-8 lg:hidden">
        <ProductInfo />
      </div>

      <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border-primary bg-background-primary lg:hidden">
        <div className="px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="max-w-[200px] truncate text-sm font-semibold">
                {product.name}
              </h2>
              <span className="text-sm font-medium">
                {formatPriceFromEuros(product.price)}
              </span>
            </div>
          </div>

          <MobileAddToCart product={product} selectedVariant={selectedVariant} />
        </div>
      </div>
    </>
  );
};
