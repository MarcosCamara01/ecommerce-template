"use client";

import Image from "next/image";

import { tintForColor } from "@/lib/tint";
import { formatPriceFromEuros } from "@/utils/formatters";

export type PreviewValues = {
  name: string;
  price: string;
  color: string;
  image: string | null;
};

/**
 * How the product card will look, on the tint its first colour gives the
 * product page (the same tint function the storefront uses).
 */
export function StorefrontPreview({ values }: { values: PreviewValues }) {
  // Until a colour is typed the card sits on the neutral panel, as in the
  // canvas, so it reads as a card instead of dissolving into the page.
  const tint = values.color
    ? tintForColor(values.color)
    : {
        light: { bg: "#F3F4F5", fg: "#111214" },
        dark: { bg: "#1C1D1F", fg: "#ECEDEE" },
      };
  const price = Number(values.price.replace(",", "."));

  return (
    <div
      className="flex flex-col gap-3 rounded-photo-lg bg-[var(--preview-bg)] p-4 text-[var(--preview-fg)] transition-[background-color,color] duration-600 ease-out dark:bg-[var(--preview-bg-dark)] dark:text-[var(--preview-fg-dark)]"
      style={
        {
          "--preview-bg": tint.light.bg,
          "--preview-fg": tint.light.fg,
          "--preview-bg-dark": tint.dark.bg,
          "--preview-fg-dark": tint.dark.fg,
        } as React.CSSProperties
      }
    >
      <span className="text-xs font-semibold uppercase tracking-[0.08em]">
        Storefront preview
      </span>
      <span className="block overflow-hidden rounded-toast bg-photo">
        {values.image ? (
          <Image
            src={values.image}
            alt=""
            width={400}
            height={533}
            sizes="400px"
            unoptimized={values.image.startsWith("data:")}
            className="aspect-[3/4] w-full object-cover"
          />
        ) : (
          <span className="grid aspect-[3/4] place-items-center text-sm text-[#111214]">
            No image yet
          </span>
        )}
      </span>
      <span className="flex justify-between gap-2.5">
        <span className="font-semibold">{values.name || "Product name"}</span>
        <span className="whitespace-nowrap tabular-nums">
          {Number.isFinite(price) && price > 0 ? formatPriceFromEuros(price) : "— €"}
        </span>
      </span>
      <span className="text-13">
        {values.color || "No colour yet"} · the product page takes this colour
      </span>
    </div>
  );
}
