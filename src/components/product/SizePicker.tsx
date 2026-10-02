"use client";

import { ProductSizeZod, type ProductSize } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";

const SIZES = ProductSizeZod.options;

/**
 * Six equal pills; one ink capsule slides to the selected size (transform
 * 220ms ease-in-out, no bounce). Sizes the variant does not stock are
 * dashed, struck through and disabled.
 */
export function SizePicker({
  available,
  value,
  onChange,
  compact = false,
}: {
  available: readonly ProductSize[];
  value: ProductSize | undefined;
  onChange: (size: ProductSize) => void;
  compact?: boolean;
}) {
  const index = value ? SIZES.indexOf(value) : -1;
  const gap = compact ? 5 : 6;

  return (
    <div
      role="group"
      aria-label="Size"
      className="relative grid grid-cols-6"
      style={{ gap }}
    >
      {index >= 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0 top-0 rounded-pill bg-fg transition-transform duration-220 ease-in-out motion-reduce:transition-none",
            compact ? "h-11" : "h-[52px]",
          )}
          style={{
            width: `calc((100% - ${gap * 5}px) / 6)`,
            transform: `translateX(calc(${index} * (100% + ${gap}px)))`,
          }}
        />
      ) : null}
      {SIZES.map((size) => {
        const inStock = available.includes(size);
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
              compact ? "h-11 text-13" : "h-[52px] text-sm",
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
