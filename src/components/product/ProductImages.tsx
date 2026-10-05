"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { PhotoViewer } from "./PhotoViewer";
/** TYPES */
import type { Product, ProductVariant } from "@/lib/db/drizzle/schema";

interface ProductImagesProps {
  name: Product["name"];
  selectedVariant: ProductVariant;
  /** Blur placeholders, available for the variant the page loaded with. */
  blurDataURLs: Record<string, string | null>;
  /** Mobile overlay controls (back, theme, wishlist). */
  overlay?: React.ReactNode;
  /** Fade the photos in: true after a colour change, not on first load. */
  fadeIn: boolean;
}

const PRODUCT_IMAGE_SIZES =
  "(max-width: 1023px) 100vw, (max-width: 1535px) 58vw, 900px";

/**
 * Phones: a full-bleed snap carousel with position dots. Desktop: the first
 * photo large, the rest in a two-up grid. A colour change fades the new
 * photos in (450ms), staggered 60ms. Pressing a photo opens it in the viewer.
 */
export const ProductImages = ({
  name,
  selectedVariant,
  blurDataURLs,
  overlay,
  fadeIn,
}: ProductImagesProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const count = selectedVariant.images.length;

  return (
    <div className="relative">
      <div
        role="region"
        aria-label={`${name} in ${selectedVariant.color}, photos`}
        tabIndex={0}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget;
          setActiveIndex(Math.round(scrollLeft / clientWidth));
        }}
        className="flex h-[430px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-b-section bg-photo [scrollbar-width:none] lg:grid lg:h-auto lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:rounded-none lg:bg-transparent"
      >
        {selectedVariant.images.map((image, index) => (
          <button
            key={`${selectedVariant.id}-${image}`}
            type="button"
            aria-label={`Enlarge photo ${index + 1} of ${count}`}
            onClick={() => setViewerAt(index)}
            data-fly-source={index === 0 ? "" : undefined}
            className={cn(
              "relative min-w-full cursor-zoom-in snap-start overflow-hidden bg-photo lg:min-w-0 lg:rounded-photo-lg",
              index === 0 ? "lg:col-span-2 lg:aspect-[4/5]" : "lg:aspect-[3/4]",
            )}
          >
            <Image
              fill
              src={image}
              alt={`${name} in ${selectedVariant.color}, photo ${index + 1} of ${count}`}
              priority={index === 0}
              // The large photo is looked at closely.
              quality={index === 0 ? 90 : undefined}
              placeholder={blurDataURLs[image] ? "blur" : "empty"}
              blurDataURL={blurDataURLs[image] ?? undefined}
              sizes={index === 0 ? PRODUCT_IMAGE_SIZES : "(max-width: 1023px) 100vw, 29vw"}
              className={cn(
                "object-cover object-top lg:object-center",
                fadeIn && "animate-swap",
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            />
          </button>
        ))}
      </div>

      <PhotoViewer
        name={name}
        color={selectedVariant.color}
        images={selectedVariant.images}
        openAt={viewerAt}
        onClose={() => setViewerAt(null)}
      />

      {overlay ? (
        <div className="absolute inset-x-2 top-2 flex justify-between lg:hidden">
          {overlay}
        </div>
      ) : null}

      {count > 1 ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5 lg:hidden"
        >
          {selectedVariant.images.map((image, dot) => (
            <span
              key={image}
              className={cn(
                "h-1 rounded-pill",
                dot === activeIndex ? "w-[18px] bg-[#111214]" : "w-1 bg-[#111214]/35",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
