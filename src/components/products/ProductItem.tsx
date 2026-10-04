import { displayName } from "@/utils/product-name";
import Link from "next/link";

import WishlistButton from "@/components/wishlist/WishlistButton";
import { swatchBackground } from "@/constants/colors";
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import { PieceTile } from "./PieceTile";

interface ProductItemProps {
  product: ProductWithVariants;
  priority?: boolean;
  sizes?: string;
}

/**
 * Listing card: photo on its own pale tile with the wishlist heart on its
 * corner, then name, colour dot and price. The hover lives in PieceTile.
 */
export const ProductItem = ({
  product,
  priority = false,
  sizes = "(max-width: 1023px) 50vw, 25vw",
}: ProductItemProps) => {
  const { name, id, img, price, category, variants } = product;
  const variant = variants[0];
  const color = variant?.color;
  const productLink = color
    ? `/${category}/${id}?variant=${encodeURIComponent(color)}`
    : `/${category}/${id}`;

  return (
    <article className="group/piece flex flex-col gap-2 lg:gap-3">
      <PieceTile
        product={product}
        variant={variant}
        href={productLink}
        src={img}
        sizes={sizes}
        priority={priority}
        className="rounded-[18px] lg:rounded-photo"
      >
        <span className="absolute right-1.5 top-1.5 lg:right-3 lg:top-3">
          <WishlistButton productId={id} productName={name} className="lg:size-11" />
        </span>
      </PieceTile>
      <Link href={productLink} className="flex justify-between gap-3 px-0.5 lg:px-1">
        <span className="flex min-w-0 flex-col gap-0.5 lg:gap-1.5">
          <span className="truncate text-13 font-medium lg:whitespace-normal lg:text-[15px]">
            {displayName(name)}
          </span>
          {color ? (
            <span className="flex items-center gap-1.5 text-xs lg:text-13">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-pill shadow-[0_0_0_1px_var(--line)] lg:size-3.5"
                style={{ background: swatchBackground(color) }}
              />
              <span className="text-muted max-lg:hidden">{color}</span>
              <span className="tabular-nums lg:hidden">{formatPriceFromEuros(price)}</span>
            </span>
          ) : null}
        </span>
        <span className="whitespace-nowrap tabular-nums max-lg:hidden">
          {formatPriceFromEuros(price)}
        </span>
      </Link>
    </article>
  );
};
