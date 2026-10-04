"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AddToCart } from "@/components/cart/AddToCart";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { merchantPlaceholders } from "@/constants/merchant";
import type {
  ProductSize,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { formatPriceFromEuros } from "@/utils/formatters";

import { ProductImages } from "./ProductImages";
import { SizePicker } from "./SizePicker";

const ALL_SIZES = 6;

const stockLine = (variant: ProductVariant) =>
  variant.sizes.length === 0
    ? "Sold out"
    : variant.sizes.length === ALL_SIZES
      ? "All sizes"
      : variant.sizes.join(" · ");

const overlayButton =
  "press grid size-11 place-items-center rounded-pill bg-white/80 text-[#111214]";

/**
 * Picking a variant swaps photos and sizes in place; the URL follows with
 * replaceState while the page keeps the selected light or dark theme.
 */
export function ProductView({
  product,
  categoryLabel,
  categoryHref,
  initialVariantId,
  blurDataURLs,
  editButton,
  details,
}: {
  product: ProductWithVariants;
  categoryLabel: string;
  categoryHref: string;
  initialVariantId: number;
  blurDataURLs: Record<string, string | null>;
  editButton: React.ReactNode;
  details: React.ReactNode;
}) {
  const [variantId, setVariantId] = useState(initialVariantId);
  const [hasChangedVariant, setHasChangedVariant] = useState(false);
  const [pickedSize, setPickedSize] = useState<ProductSize | null>(null);

  const variant =
    product.variants.find((candidate) => candidate.id === variantId) ??
    product.variants[0];
  // Keep the picked size when the new colour stocks it.
  const size =
    pickedSize && variant.sizes.includes(pickedSize)
      ? pickedSize
      : variant.sizes[0];
  const price = formatPriceFromEuros(product.price);

  const pickVariant = (next: ProductVariant) => {
    if (next.id === variant.id) return;
    setHasChangedVariant(true);
    setVariantId(next.id);
    window.history.replaceState(
      null,
      "",
      `?variant=${encodeURIComponent(next.color)}`,
    );
  };

  return (
    <>
      <div
        // Activity retains hidden pages in the DOM. Only the active product
        // should hide the mobile header and reserve space for its fixed CTA.
        ref={(page) => {
          if (!page) return;
          page.setAttribute("data-product-page", "");
          page.setAttribute("data-fixed-cta", "");
          return () => {
            page.removeAttribute("data-product-page");
            page.removeAttribute("data-fixed-cta");
          };
        }}
        data-product-page=""
        data-fixed-cta=""
        className="-mx-4 grid lg:mx-0 lg:grid-cols-[minmax(0,7fr)_minmax(400px,5fr)] lg:items-start lg:gap-12 lg:pb-24 lg:pt-8"
      >
        <ProductImages
          key={variant.id}
          name={product.name}
          selectedVariant={variant}
          blurDataURLs={blurDataURLs}
          fadeIn={hasChangedVariant}
          overlay={
            <>
              <Link
                href={categoryHref}
                aria-label={`Back to ${categoryLabel}`}
                className={overlayButton}
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </Link>
              <span className="flex gap-1.5">
                <ThemeToggle className="bg-white/80 text-[#111214]" />
                <WishlistButton
                  productId={product.id}
                  productName={product.name}
                  className="size-11"
                />
              </span>
            </>
          }
        />

        <div className="flex min-w-0 flex-col gap-3.5 px-4 pb-32 pt-[18px] lg:sticky lg:top-[100px] lg:gap-7 lg:px-0 lg:pb-0 lg:pt-0">
          <div className="flex flex-col gap-3.5">
            <div className="hidden items-center justify-between gap-3 lg:flex">
              <span className="text-13">
                {categoryLabel} · Ref. {String(product.id).padStart(3, "0")}
              </span>
              {editButton}
            </div>
            <div className="flex items-end justify-between gap-3 lg:flex-col lg:items-start lg:gap-3.5">
              <h1 className="font-display text-[46px] leading-[0.86] lg:text-[min(104px,7.2vw)] lg:leading-[0.84]">
                {product.name}
              </h1>
              <span className="whitespace-nowrap text-lg font-medium tabular-nums lg:text-[26px]">
                {price}
              </span>
            </div>
          </div>
          {/* On phones the description follows the buying controls. */}
          <p className="max-w-[60ch] text-muted max-lg:order-1 lg:-mt-3.5">
            {product.description}
          </p>

          <div className="flex flex-col gap-3">
            <span className="hidden text-sm lg:block">
              Colour <span className="text-muted">— {variant.color}</span>
            </span>
            <div
              role="group"
              aria-label="Colour"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:overflow-visible lg:px-0"
            >
              {product.variants.map((option) => {
                const selected = option.id === variant.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pickVariant(option)}
                    className={cn(
                      "press flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill pl-1 pr-3.5 text-left text-13 lg:whitespace-normal lg:h-auto lg:gap-3 lg:rounded-chip lg:p-1.5 lg:pr-3.5 lg:text-[15px]",
                      selected
                        ? "border-[1.5px] border-fg lg:bg-card"
                        : "border border-line hover:border-fg",
                    )}
                  >
                    {option.images[0] ? (
                      <Image
                        src={option.images[0]}
                        alt=""
                        width={48}
                        height={60}
                        sizes="48px"
                        className="size-10 shrink-0 rounded-pill bg-photo object-cover lg:h-[60px] lg:w-12 lg:rounded-[14px]"
                      />
                    ) : null}
                    <span className="flex flex-col leading-tight">
                      <span className="lg:font-medium">{option.color}</span>
                      <span className="hidden text-xs text-muted lg:block">
                        {stockLine(option)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span>
                Size <span className="text-muted">— {size ?? "None left"}</span>
              </span>
              <Link
                href="/help/size-guide"
                className="underline underline-offset-[3px]"
              >
                Size guide
              </Link>
            </div>
            <SizePicker
              available={variant.sizes}
              value={size}
              onChange={setPickedSize}
            />
            <span className="text-13">Fit: {merchantPlaceholders.fitNote}</span>
          </div>

          <div className="flex gap-2">
            <div className="fixed inset-x-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-30 lg:static lg:grow">
              <AddToCart
                key={`${variant.id}-${size}`}
                product={product}
                selectedVariant={variant}
                size={size}
                flySource={() => document.querySelector("[data-fly-source]")}
                className="h-[60px] shadow-[0_16px_40px_rgba(0,0,0,.25)] lg:h-16 lg:shadow-none"
              />
            </div>
            <WishlistButton
              productId={product.id}
              productName={product.name}
              appearance="outline"
              className="hidden lg:grid"
            />
          </div>

          <ul className="flex flex-col gap-2 text-sm max-lg:order-2">
            <li className="flex items-center gap-2.5">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              >
                <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
                <circle cx="7" cy="18" r="1.6" />
                <circle cx="17" cy="18" r="1.6" />
              </svg>
              <span>Delivery: {merchantPlaceholders.deliveryEstimate}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M4 12a8 8 0 1 0 3-6.2" />
                <path d="M4 4v4h4" />
              </svg>
              <span>Returns: {merchantPlaceholders.returnPolicy}</span>
            </li>
          </ul>

          <div className="max-lg:order-2">{details}</div>
        </div>
      </div>
    </>
  );
}
