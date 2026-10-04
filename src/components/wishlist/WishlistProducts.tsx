"use client";

import { displayName } from "@/utils/product-name";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { AddToCart } from "@/components/cart/AddToCart";
import { swatchBackground } from "@/constants/colors";
import { useWishlistDetails } from "@/hooks/wishlist";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ProductSize, ProductWithVariants } from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import WishlistButton from "./WishlistButton";

/** A saved piece with quick add: pick a size, add it to the bag. */
function SavedPiece({ product }: { product: ProductWithVariants }) {
  const variant = product.variants[0];
  const [size, setSize] = useState<ProductSize | undefined>(variant?.sizes[0]);
  const photoRef = useRef<HTMLSpanElement>(null);
  if (!variant) return null;
  const href = `/${product.category}/${product.id}?variant=${encodeURIComponent(variant.color)}`;

  return (
    <article className="piece flex flex-col gap-2.5">
      <span ref={photoRef} className="relative block overflow-hidden rounded-photo bg-photo">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="piece-link">
          <Image
            src={variant.images[0] ?? product.img}
            alt=""
            width={300}
            height={400}
            sizes="(max-width: 1023px) 50vw, 25vw"
            className="aspect-[3/4] w-full object-cover"
          />
        </Link>
        <span className="absolute right-2.5 top-2.5">
          <WishlistButton showsRemove productId={product.id} productName={product.name} />
        </span>
      </span>
      <Link href={href} className="piece-link flex justify-between gap-2.5 px-1">
        <span className="piece-name font-medium">{displayName(product.name)}</span>
        <span className="whitespace-nowrap tabular-nums">{formatPriceFromEuros(product.price)}</span>
      </Link>
      <span className="flex items-center gap-1.5 px-1 text-13 text-muted">
        <span
          aria-hidden="true"
          className="size-2.5 rounded-pill shadow-[0_0_0_1px_var(--line)]"
          style={{ background: swatchBackground(variant.color) }}
        />
        {variant.color}
      </span>
      <div className="flex gap-1.5">
        <label className="relative h-11 w-16 shrink-0">
          <span className="sr-only">Size for {product.name}</span>
          <NativeSelect
            variant="compact"
            value={size ?? ""}
            onChange={(event) => setSize(event.target.value as ProductSize)}
            disabled={variant.sizes.length === 0}
          >
            {variant.sizes.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <div className="grow">
          <AddToCart
            key={`${variant.id}-${size}`}
            compact
            product={product}
            selectedVariant={variant}
            size={size}
            flySource={() => photoRef.current}
            className="h-11"
          />
        </div>
      </div>
    </article>
  );
}

export const WishlistProducts = ({ emptyState }: { emptyState: React.ReactNode }) => {
  const { items, isPending } = useWishlistDetails();

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading your wishlist" className="grid grid-cols-2 gap-x-3 gap-y-7 border-t border-line pt-5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="aspect-[3/4] rounded-photo" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return <>{emptyState}</>;

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 border-t border-line pt-5 lg:grid-cols-[repeat(auto-fill,minmax(min(300px,44%),1fr))]">
      {items.map(({ id, product }) => (
        <SavedPiece key={id} product={product} />
      ))}
    </div>
  );
};

/** "4 pieces" beside the title, once the wishlist has loaded. */
export const WishlistCount = () => {
  const { items, isSuccess } = useWishlistDetails();
  if (!isSuccess) return null;
  return (
    <span
      aria-label={`${items.length} ${items.length === 1 ? "piece" : "pieces"}`}
      className="pb-1.5 font-display text-[40px] font-extrabold leading-none tabular-nums lg:text-[64px]"
    >
      {String(items.length).padStart(2, "0")}
    </span>
  );
};
