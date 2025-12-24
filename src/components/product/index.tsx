/** FUNCTIONALITY */
import { redirect } from "next/navigation";
import { getProduct } from "@/app/actions";
/** COMPONENTS */
import { ProductImages } from "@/components/product/Images";
import AddToCart from "../cart/addToCart";
import { Info } from "./DefaultInfo";
/** TYPES */
import type { ProductVariant } from "@/schemas";

interface SingleProductProps {
  id: string;
  selectedVariantColor?: ProductVariant["color"];
}

export const SingleProduct = async ({
  id,
  selectedVariantColor,
}: SingleProductProps) => {
  const productPlainObject = await getProduct(Number(id));

  const productJSON = JSON.stringify(productPlainObject);

  if (!productPlainObject) {
    return <div>Product not found</div>;
  }

  const selectedVariantObject = productPlainObject.variants.find(
    (v) => v.color === selectedVariantColor
  );

  if (!selectedVariantObject) {
    return redirect(
      `/${productPlainObject.category}/${id}?variant=${productPlainObject.variants[0].color}`
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:gap-6 xl:gap-8">
        <div className="w-full lg:w-[60%] xl:w-[65%] 2xl:w-[70%]">
          <ProductImages
            name={productPlainObject.name}
            selectedVariant={selectedVariantObject}
          />
        </div>

        {/* Desktop only */}
        <div className="hidden lg:block lg:w-[40%] xl:w-[35%] 2xl:w-[30%]">
          <div className="sticky top-20 flex flex-col gap-5">
            <div className="w-full border border-solid overflow-hidden rounded border-border-primary bg-background-secondary">
              <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary">
                <h1 className="text-lg font-semibold">
                  {productPlainObject.name}
                </h1>
                <span className="text-base font-medium">
                  {productPlainObject.price}€
                </span>
                <p className="text-sm break-all text-color-secondary line-clamp-5">
                  {productPlainObject.description}
                </p>
              </div>

              <AddToCart
                productJSON={productJSON}
                selectedVariant={selectedVariantObject}
              />
            </div>

            <Info />
          </div>
        </div>
      </div>

      {/* Mobile only */}
      <div className="lg:hidden mt-6 px-2 xs:px-4 sm:px-6 md:px-8">
        <Info />
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-primary border-t border-border-primary safe-area-bottom">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold truncate max-w-[200px]">
                {productPlainObject.name}
              </h2>
              <span className="text-sm font-medium">
                {productPlainObject.price}€
              </span>
            </div>
          </div>

          <AddToCart
            productJSON={productJSON}
            selectedVariant={selectedVariantObject}
            isMobileBar
          />
        </div>
      </div>
    </>
  );
};
