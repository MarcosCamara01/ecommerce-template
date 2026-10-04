import { displayName } from "@/utils/product-name";
import Link from "next/link";

import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import { PieceTile } from "./PieceTile";

/**
 * A plain product card for rails ("Wear it with", "Goes with"): 24px photo
 * tile, name and price below. The hover lives in PieceTile.
 */
export function RailCard({
  product,
  sizes = "(max-width: 1023px) 50vw, 25vw",
}: {
  product: ProductWithVariants;
  sizes?: string;
}) {
  const variant = product.variants[0];
  const href = variant
    ? `/${product.category}/${product.id}?variant=${encodeURIComponent(variant.color)}`
    : `/${product.category}/${product.id}`;

  return (
    <article className="group/piece flex flex-col gap-3">
      <PieceTile
        product={product}
        variant={variant}
        href={href}
        src={variant?.images[0] ?? product.img}
        sizes={sizes}
      />
      <Link href={href} className="flex justify-between gap-3 px-1">
        <span className="font-medium">{displayName(product.name)}</span>
        <span className="whitespace-nowrap tabular-nums">
          {formatPriceFromEuros(product.price)}
        </span>
      </Link>
    </article>
  );
}
