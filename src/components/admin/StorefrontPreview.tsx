"use client";

import Image from "next/image";

import { formatPriceFromEuros } from "@/utils/formatters";

export type PreviewValues = {
  name: string;
  price: string;
  color: string;
  image: string | null;
};

/** How the product card will look in the active storefront theme. */
export function StorefrontPreview({ values }: { values: PreviewValues }) {
  const price = Number(values.price.replace(",", "."));

  return (
    <div className="flex flex-col gap-3 rounded-photo-lg bg-field p-4 text-fg">
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
        {values.color || "No color yet"}
      </span>
    </div>
  );
}
