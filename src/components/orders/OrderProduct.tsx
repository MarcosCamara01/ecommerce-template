/** COMPONENTS */
import Image from "next/image";
import Link from "@/components/ui/link";
/** TYPES */
import type {
  OrderProductWithDetails,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { swatchBackground } from "@/constants/colors";
import { formatPriceFromMinorUnits } from "@/utils/formatters";
import { getBlurDataURL } from "@/lib/images/blur.server";
import { orderProductLink } from "./order-product-link";

interface OrderProductProps {
  product: ProductWithVariants;
  size: OrderProductWithDetails["size"];
  quantity: OrderProductWithDetails["quantity"];
  unitAmount: OrderProductWithDetails["unitAmount"];
  currency: OrderProductWithDetails["currency"];
  productName: OrderProductWithDetails["productName"];
  variantColor: OrderProductWithDetails["variantColor"];
  imageUrl: OrderProductWithDetails["imageUrl"];
  priority?: boolean;
}

/**
 * One bought line, priced from the immutable order record. Archived
 * products keep their photo and name but lose the catalogue link.
 */
export const OrderProduct = async ({
  product,
  size,
  quantity,
  unitAmount,
  currency,
  productName,
  variantColor,
  imageUrl,
  priority = false,
}: OrderProductProps) => {
  const { category, id, variants } = product;
  const variant = variants[0];
  const productLink = orderProductLink({
    productId: id,
    category,
    productArchivedAt: product.archivedAt,
    variantColor,
    variantArchivedAt: variant.archivedAt,
  });
  const isArchived = productLink === null;
  const blurDataURL = await getBlurDataURL(imageUrl);

  const photo = (
    <Image
      src={imageUrl}
      alt={productName}
      width={140}
      height={187}
      priority={priority}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL ?? undefined}
      sizes="(max-width: 1023px) 96px, 140px"
      className="aspect-[3/4] w-full object-cover"
    />
  );

  return (
    <article className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-[18px] border-b border-line py-4 lg:grid-cols-[140px_minmax(0,1fr)_auto]">
      <div className="overflow-hidden rounded-chip bg-photo">
        {isArchived ? photo : <Link href={productLink!}>{photo}</Link>}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="font-display-75 text-xl leading-none lg:text-[30px] lg:[word-spacing:0.1em]">
          {productName}
        </h3>
        <span className="flex items-center gap-2 text-sm text-muted">
          <span
            aria-hidden="true"
            className="size-3 rounded-pill shadow-[0_0_0_1px_var(--line)]"
            style={{ background: swatchBackground(variantColor) }}
          />
          <span>
            {variantColor} · Size {size} · Qty {quantity}
          </span>
        </span>
        {isArchived ? (
          <span className="text-sm text-muted">Archived item</span>
        ) : (
          <Link
            href={productLink!}
            className="self-start text-sm underline underline-offset-[3px]"
          >
            Buy again
          </Link>
        )}
      </div>
      <span className="self-start whitespace-nowrap text-lg font-medium tabular-nums">
        {formatPriceFromMinorUnits(unitAmount, currency)}
      </span>
    </article>
  );
};
