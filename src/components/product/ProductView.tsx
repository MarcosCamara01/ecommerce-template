"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AddToCart } from "@/components/cart/AddToCart";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { merchantPlaceholders } from "@/constants/merchant";
import type {
  ProductSize,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { fitDisplayStep } from "@/lib/display-type";
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

// Desktop sizes for the name, largest first. A short name is set giant; a
// longer one steps down until it is no taller than two lines of the largest
// size, so the buying controls stay on the first screen. Each step also
// yields to a short window (vh), like the home hero.
const NAME_STEPS = [
  { px: 104, leading: 0.84, className: "lg:text-[min(104px,7.2vw,12.5vh)] lg:leading-[0.84]" },
  { px: 80, leading: 0.86, className: "lg:text-[min(80px,5.6vw,9.6vh)] lg:leading-[0.86]" },
  { px: 64, leading: 0.88, className: "lg:text-[min(64px,4.5vw,7.7vh)] lg:leading-[0.88]" },
  { px: 56, leading: 0.9, className: "lg:text-[min(56px,3.9vw,6.7vh)] lg:leading-[0.9]" },
  { px: 44, leading: 0.92, className: "lg:text-[min(44px,3.1vw,5.3vh)] lg:leading-[0.92]" },
] as const;
// The buy column is never narrower than this many times the largest size.
const NAME_MEASURE_EM = 5.18;
const NAME_BUDGET_PX = 2 * NAME_STEPS[0].px * NAME_STEPS[0].leading;

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
  const nameStep = fitDisplayStep(product.name, NAME_STEPS, {
    measureEm: NAME_MEASURE_EM,
    budgetPx: NAME_BUDGET_PX,
  });

  // In a window too short for the name, colours, sizes and button, the buy
  // column would keep the button below the fold for as long as it sticks.
  // Knowing how far down the buy row ends, CSS lets the column scroll up
  // just until the row sits at the bottom of the window, and hold there.
  const columnRef = useRef<HTMLDivElement>(null);
  const sizesRef = useRef<HTMLDivElement>(null);
  const buyRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const column = columnRef.current;
    const sizes = sizesRef.current;
    const buyRow = buyRowRef.current;
    if (!column || !sizes || !buyRow) return;
    const observer = new ResizeObserver(() => {
      // A row held to the edge reports where it is drawn, so its own place
      // is taken from the block above it.
      const gap = parseFloat(getComputedStyle(column).rowGap) || 0;
      const end = sizes.offsetTop + sizes.offsetHeight + gap + buyRow.offsetHeight;
      column.style.setProperty("--buy-height", `${end}px`);
    });
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

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
        // Activity retains hidden pages in the DOM. Reserve footer space for
        // the fixed CTA only while this product is active.
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
                <WishlistButton
                  productId={product.id}
                  productName={product.name}
                  className="size-11"
                />
              </span>
            </>
          }
        />

        <div
          ref={columnRef}
          className="flex min-w-0 flex-col gap-3.5 px-4 pb-32 pt-[18px] lg:sticky lg:top-[min(100px,calc(100dvh_-_var(--buy-height,0px)))] lg:gap-7 lg:px-0 lg:pb-0 lg:pt-0"
        >
          <div className="flex flex-col gap-3.5">
            <div className="hidden items-center justify-between gap-3 lg:flex">
              <span className="text-13">
                {categoryLabel} · Ref. {String(product.id).padStart(3, "0")}
              </span>
              {editButton}
            </div>
            <div className="flex items-end justify-between gap-3 lg:flex-col lg:items-start lg:gap-3.5">
              <h1 className={cn("font-display text-[46px] leading-[0.86]", nameStep.className)}>
                {product.name}
              </h1>
              <span className="whitespace-nowrap text-lg font-medium tabular-nums lg:text-[26px]">
                {price}
              </span>
            </div>
          </div>
          {/* The description follows the buying controls. */}
          <p className="order-1 max-w-[60ch] text-muted">
            {product.description}
          </p>

          <div className="flex flex-col gap-3">
            <span className="hidden text-sm lg:block">
              Color <span className="text-muted">— {variant.color}</span>
            </span>
            <div
              role="group"
              aria-label="Color"
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

          <div ref={sizesRef} className="flex flex-col gap-3">
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

          {/* Add to bag never leaves the window. On phones it is pinned to
              the bottom of the screen; on desktop, while the column runs past
              the window, the row holds to the bottom edge on the page ground
              and the column scrolls beneath it. */}
          <div
            ref={buyRowRef}
            className="flex gap-2 lg:sticky lg:bottom-0 lg:z-10 lg:-mb-6 lg:bg-bg lg:pb-6 lg:before:pointer-events-none lg:before:absolute lg:before:inset-x-0 lg:before:bottom-full lg:before:h-4 lg:before:bg-gradient-to-t lg:before:from-bg lg:before:to-transparent"
          >
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

          <ul className="order-2 flex flex-col gap-2 text-sm">
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

          <div className="order-2">{details}</div>
        </div>
      </div>
    </>
  );
}
