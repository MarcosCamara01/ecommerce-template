"use client";

import { useState } from "react";

import { PRODUCT_SIZES } from "@/constants/sizes";
import type { ProductSize } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";

/**
 * Size chart with a tappable size row: the chosen column is highlighted.
 * Measurements stay as placeholders until the merchant defines them.
 */
export function SizeChart({ rows }: { rows: readonly string[] }) {
  const [selected, setSelected] = useState<ProductSize>("M");

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-x-1 border-spacing-y-0 text-center text-sm tabular-nums">
        <thead>
          <tr>
            <th scope="col" className="pb-2.5 pr-2 text-left text-13 font-medium">
              Size
            </th>
            {PRODUCT_SIZES.map((size) => (
              <th key={size} scope="col" className="pb-2.5">
                <button
                  type="button"
                  aria-pressed={size === selected}
                  onClick={() => setSelected(size)}
                  className="press h-11 w-full min-w-10 rounded-pill border border-line font-semibold transition-[background-color,color,border-color,transform] duration-120 aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-bg"
                >
                  {size}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((name) => (
            <tr key={name}>
              <th scope="row" className="border-t border-line py-3 pr-2 text-left font-medium">
                {name}
              </th>
              {PRODUCT_SIZES.map((size) => (
                <td
                  key={size}
                  className={cn(
                    "border-t border-line py-3",
                    size === selected && "bg-fg/[0.08] font-bold",
                  )}
                >
                  [—]
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
