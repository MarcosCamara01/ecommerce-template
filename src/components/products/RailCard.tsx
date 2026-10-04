import { displayName } from "@/utils/product-name";
import Link from "next/link";

import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import { PiecePhoto } from "./PiecePhoto";

/**
 * A plain product tile for rails ("Wear it with", "Goes with"): 24px photo
 * tile, name and price below. Pointing at it shows the next photo.
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
    <Link href={href} className="group/piece flex flex-col gap-3">
      <span className="relative block aspect-[3/4] overflow-hidden rounded-photo bg-photo">
        <PiecePhoto
          src={variant?.images[0] ?? product.img}
          nextSrc={variant?.images[1]}
          alt={product.name}
          sizes={sizes}
        />
      </span>
      <span className="flex justify-between gap-3 px-1">
        <span className="font-medium">{displayName(product.name)}</span>
        <span className="whitespace-nowrap tabular-nums">
          {formatPriceFromEuros(product.price)}
        </span>
      </span>
    </Link>
  );
}
