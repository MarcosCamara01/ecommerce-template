"use client";

import Link from "next/link";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BottomSheet, BottomSheetClose } from "@/components/ui/bottom-sheet";
import type { ShopSection } from "@/constants/navigation";
import { useFlip } from "@/hooks/useFlip";
import {
  ProductSizeZod,
  type ProductSize,
  type ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";

import { ProductItem } from "./ProductItem";

type Sort = "newest" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
];

const sorters: Record<Sort, (a: ProductWithVariants, b: ProductWithVariants) => number> = {
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

const stocks = (product: ProductWithVariants, size: ProductSize) =>
  product.variants.some((variant) => variant.sizes.includes(size));

const chip =
  "press flex shrink-0 items-center gap-1 rounded-pill border px-4 text-sm aria-[current=page]:border-fg aria-[current=page]:bg-fg aria-[current=page]:text-bg lg:px-[18px]";

/**
 * Filter bar and grid for a store section. Section chips are links; size,
 * sort and grid density are local view state. When one of them re-arranges
 * the grid, each piece glides to its new place and size (useFlip) instead
 * of jumping there, and the ink of the density switch slides across.
 */
export function CatalogListing({
  products,
  sections,
  activeKey,
}: {
  products: ProductWithVariants[];
  sections: (ShopSection & { count?: number })[];
  activeKey: ShopSection["key"];
}) {
  const [size, setSize] = useState<ProductSize | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [columns, setColumns] = useState<3 | 4>(4);
  const [sheetOpen, setSheetOpen] = useState(false);
  const gridRef = useFlip<HTMLDivElement>();

  const shown = products
    .filter((product) => !size || stocks(product, size))
    .sort(sorters[sort]);
  const sortLabel = SORTS.find((option) => option.value === sort)?.label;

  return (
    <>
      <div className="-mx-4 flex items-center justify-between gap-4 overflow-x-auto px-4 py-3.5 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:border-t lg:border-line lg:px-0 lg:pb-7 lg:pt-5">
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Filter and sort"
            onClick={() => setSheetOpen(true)}
            className="press grid h-10 w-11 shrink-0 place-items-center rounded-pill border border-line lg:hidden"
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
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="8" cy="17" r="2" />
            </svg>
          </button>
          <nav aria-label="Sections" className="flex gap-1.5">
            {sections.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                aria-current={section.key === activeKey ? "page" : undefined}
                className={cn(chip, "h-10 border-line lg:h-11")}
              >
                {section.key === "new-in" ? "All" : section.label}
                {section.count !== undefined ? (
                  <span className="tabular-nums opacity-80 max-lg:hidden">
                    {section.count}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(chip, "h-11 border-line")}>
              Size · {size ?? "Any"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-44">
              <DropdownMenuRadioGroup
                value={size ?? "any"}
                onValueChange={(value) =>
                  setSize(value === "any" ? null : (value as ProductSize))
                }
              >
                <DropdownMenuRadioItem value="any">Any size</DropdownMenuRadioItem>
                {ProductSizeZod.options.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(chip, "h-11 border-line")}>
              Sort · {sortLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => setSort(value as Sort)}
              >
                {SORTS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div
            role="group"
            aria-label="Grid density"
            className="relative flex rounded-pill border border-line p-1"
          >
            {/* One ink capsule slides between the two, as on the size pills. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-1 top-1 h-9 w-11 rounded-pill bg-fg transition-transform duration-220 ease-in-out motion-reduce:transition-none",
                columns === 4 && "translate-x-full",
              )}
            />
            {([3, 4] as const).map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={columns === count}
                aria-label={`${count} columns`}
                onClick={() => setColumns(count)}
                className="press relative h-9 w-11 rounded-pill text-13 font-semibold transition-[color,transform] duration-220 ease-in-out aria-pressed:text-bg"
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-24 text-center text-muted">
          Nothing in {size} here yet.{" "}
          <button
            type="button"
            onClick={() => setSize(null)}
            className="text-fg underline underline-offset-[3px]"
          >
            Show every size
          </button>
        </p>
      ) : null}
      {/* Stays mounted when a size empties it, so the pieces rise back in. */}
      <div
        ref={gridRef}
        className={cn(
          "grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:gap-x-4 lg:gap-y-7",
          columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        )}
      >
        {shown.map((product, index) => (
          <ProductItem
            key={product.id}
            product={product}
            priority={index < 2}
            sizes={`(max-width: 1023px) 50vw, ${columns === 3 ? 33 : 25}vw`}
          />
        ))}
      </div>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Filter"
      >
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-medium">Size</legend>
          <div className="flex flex-wrap gap-1.5">
            {[null, ...ProductSizeZod.options].map((option) => (
              <button
                key={option ?? "any"}
                type="button"
                aria-pressed={size === option}
                onClick={() => setSize(option)}
                className="press h-11 min-w-12 rounded-pill border border-line px-4 text-sm aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg"
              >
                {option ?? "Any"}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-medium">Sort</legend>
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={sort === option.value}
                onClick={() => setSort(option.value)}
                className="press h-11 rounded-pill border border-line px-4 text-sm aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg"
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <BottomSheetClose className="press mt-2 h-14 rounded-pill bg-fg font-semibold text-bg">
          Show {shown.length} {shown.length === 1 ? "piece" : "pieces"}
        </BottomSheetClose>
      </BottomSheet>
    </>
  );
}
