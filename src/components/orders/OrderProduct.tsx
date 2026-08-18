/** COMPONENTS */
import { ProductImage } from "../products/ProductImage";
import Link from "next/link";
/** TYPES */
import type {
  OrderProductWithDetails,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { formatPriceFromMinorUnits } from "@/utils/formatters";
import { getBlurDataURL } from "@/lib/images/blur.server";
import { orderProductLink } from "./order-product-link";

interface OrderProductProps {
  product: ProductWithVariants;
  size: OrderProductWithDetails["size"];
  quantity: OrderProductWithDetails["quantity"];
  unitAmount: OrderProductWithDetails["unitAmount"];
  currency: OrderProductWithDetails["currency"];
}

export const OrderProduct = async ({
  product,
  size,
  quantity,
  unitAmount,
  currency,
}: OrderProductProps) => {
  const { name, category, id, variants } = product;
  const variant = variants[0];
  const productLink = orderProductLink({
    productId: id,
    category,
    productArchivedAt: product.archivedAt,
    variantColor: variant.color,
    variantArchivedAt: variant.archivedAt,
  });
  const isArchived = productLink === null;
  const blurDataURL = await getBlurDataURL(variant.images[0]);

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-md border border-solid border-border-primary">
      {isArchived ? (
        <div>
          <ProductImage
            image={variant.images[0]}
            blurDataURL={blurDataURL}
            name={name}
            width={280}
            height={425}
            sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
          />
        </div>
      ) : (
        <Link href={productLink!} className="transition-all hover:scale-105">
        <ProductImage
          image={variant.images[0]}
          blurDataURL={blurDataURL}
          name={name}
          width={280}
          height={425}
          sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
        </Link>
      )}
      <div className="z-10 flex flex-col justify-between gap-2.5 bg-background-secondary p-3.5">
        <div className="flex w-full justify-between">
          {isArchived ? (
            <div className="w-10/12">
              <h2 className="truncate text-sm font-semibold">{name}</h2>
              <span className="text-xs text-color-tertiary">Archived item</span>
            </div>
          ) : (
            <Link href={productLink!} className="w-10/12">
            <h2 className="truncate text-sm font-semibold">{name}</h2>
            </Link>
          )}
        </div>

        <div className="text-sm">
          {formatPriceFromMinorUnits(unitAmount, currency)}
        </div>

        <div className="flex sm:hidden">
          <div className="border-r pr-2.5 text-sm">{size}</div>
          <div className="pl-2.5 text-sm">{variant.color}</div>
        </div>

        <div className="hidden items-center justify-between sm:flex">
          <div
            className="flex w-min bg-background-primary"
            aria-label={`Quantity: ${quantity}`}
          >
            <span className="flex h-8 min-w-8 items-center justify-center rounded border border-solid border-border-primary px-2 text-sm">
              {quantity}
            </span>
          </div>
          <div className="flex">
            <div className="border-r pr-2.5 text-sm">{size}</div>
            <div className="pl-2.5 text-sm">{variant.color}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
