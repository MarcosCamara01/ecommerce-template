"use client";

import { PRODUCT_SIZES } from "@/constants/sizes";
import type { ProductSize } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";

const SIZES = PRODUCT_SIZES;

/**
 * Equal pills (the full run by default); one ink capsule slides to the selected size (transform
 * 220ms ease-in-out, no bounce). Sizes the variant does not stock are
 * dashed, struck through and disabled.
 */
export function SizePicker({
  available,
  value,
  onChange,
  compact = false,
  options = SIZES,
}: {
  available: readonly ProductSize[];
  value: ProductSize | undefined;
  onChange: (size: ProductSize) => void;
  compact?: boolean;
  /** Which sizes get a pill; defaults to the full run. */
  options?: readonly ProductSize[];
}) {
  const index = value ? options.indexOf(value) : -1;
  const gap = compact ? 5 : 6;
  const n = options.length;
  const inStockSizes = new Set(available);

  return (
    <div
      role="group"
      aria-label="Size"
      className="relative grid"
      style={{ gap, gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {index >= 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0 top-0 rounded-pill bg-fg transition-transform duration-220 ease-in-out motion-reduce:transition-none",
            compact ? "h-11" : "h-11 lg:h-[52px]",
          )}
          style={{
            width: `calc((100% - ${gap * (n - 1)}px) / ${n})`,
            transform: `translateX(calc(${index} * (100% + ${gap}px)))`,
          }}
        />
      ) : null}
      {options.map((size) => {
        const inStock = inStockSizes.has(size);
        const selected = size === value;
        return (
          <button
            key={size}
            type="button"
            disabled={!inStock}
            aria-pressed={selected}
            aria-label={inStock ? undefined : `${size}, out of stock`}
            onClick={() => onChange(size)}
            className={cn(
              "press relative rounded-pill border transition-[color,transform] duration-220 ease-in-out",
              compact ? "h-11 text-13" : "h-11 text-13 lg:h-[52px] lg:text-sm",
              selected
                ? "border-transparent text-bg"
                : inStock
                  ? "border-line text-fg hover:border-fg"
                  : "border-dashed border-line text-fg line-through opacity-65",
            )}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
