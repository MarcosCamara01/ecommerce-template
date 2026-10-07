"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { ProductVariant, ProductWithVariants } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";

import { QuickAdd } from "./QuickAdd";

/**
 * The photo tile of a product card, with the card's hover. Put `group/piece`
 * on the card: while it is pointed at, or holds keyboard focus (not the
 * focus a mouse click leaves behind, which would keep the card open),
 *
 * - the piece's next photo rises over the first like a sheet (clip-path,
 *   500ms ease-out) and settles from a slight zoom, then drops back;
 * - a glass capsule with the sizes rises over its foot (see QuickAdd).
 *
 * Both only exist for pointers that can hover, so a touch screen never
 * downloads the second photo. Under reduced motion the photo cross-fades.
 */
export function PieceTile({
  product,
  variant,
  href,
  src,
  sizes,
  priority = false,
  quickAdd = true,
  className,
  children,
  ref,
}: {
  product: ProductWithVariants;
  variant: ProductVariant | undefined;
  href: string;
  src: string;
  sizes: string;
  priority?: boolean;
  /** Off where the card has its own size and add controls. */
  quickAdd?: boolean;
  className?: string;
  /** Controls that sit on the photo, such as the wishlist heart. */
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const photoRef = useRef<HTMLAnchorElement>(null);
  // Usually the second photo of the colour: a closer look, on the model.
  const nextSrc = variant?.images[1];

  return (
    <div
      ref={ref}
      // Where a grid re-arranges (useFlip) the tile follows its box.
      data-flip-part="morph"
      className={cn("relative overflow-hidden rounded-photo bg-photo", className)}
    >
      {/* The name below is the link people read; this one is for the pointer. */}
      <Link
        ref={photoRef}
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[3/4]"
      >
        <Image
          fill
          src={src}
          alt=""
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
        {canHover && nextSrc && nextSrc !== src ? (
          <span className="absolute inset-0 transition-[clip-path,opacity] duration-300 ease-out [clip-path:inset(100%_0_0_0_round_24px_24px_0_0)] group-has-[:focus-visible]/piece:[clip-path:inset(0_0_0_0_round_0px)] group-hover/piece:duration-500 group-hover/piece:[clip-path:inset(0_0_0_0_round_0px)] motion-reduce:opacity-0 motion-reduce:[clip-path:none] motion-reduce:group-has-[:focus-visible]/piece:opacity-100 motion-reduce:group-hover/piece:opacity-100">
            <Image
              fill
              data-fly=""
              src={nextSrc}
              alt=""
              sizes={sizes}
              // Never ahead of the photos that are on show.
              fetchPriority="low"
              className="scale-110 object-cover transition-transform duration-300 ease-out group-has-[:focus-visible]/piece:scale-100 group-hover/piece:scale-100 group-hover/piece:duration-700 motion-reduce:scale-100"
            />
          </span>
        ) : null}
      </Link>
      {children}
      {canHover && quickAdd && variant ? (
        <QuickAdd
          product={product}
          variant={variant}
          flySource={() => photoRef.current}
        />
      ) : null}
    </div>
  );
}
