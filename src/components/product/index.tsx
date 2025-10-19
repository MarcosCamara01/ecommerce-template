/** FUNCTIONALITY */
import { redirect } from "next/navigation";
import { getProduct } from "@/app/actions";
/** COMPONENTS */
import { ProductImages } from "@/components/product/Images";
import AddToCart from "../cart/addToCart";
import { Info } from "./DefaultInfo";
/** TYPES */
import type { ProductVariant } from "@/schemas/ecommerce";

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
    return <div>Produnct not found</div>;
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
    <div className="flex flex-wrap justify-between gap-8">
      <div className="grow-999 basis-0">
        <ProductImages
          name={productPlainObject.name}
          selectedVariant={selectedVariantObject}
        />
      </div>

      <div className="sticky flex flex-col items-center justify-center w-full h-full gap-5 grow basis-600 top-8">
        <div className="w-full border border-solid rounded border-border-primary bg-background-secondary">
          <div className="flex flex-col justify-between gap-3 p-5 border-b border-solid border-border-primary">
            <h1 className="text-base font-semibold">
              {productPlainObject.name}
            </h1>
            <span className="text-sm">{productPlainObject.price}€</span>
            <p className="text-sm line-clamp-5 break-words">
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
  );
};
