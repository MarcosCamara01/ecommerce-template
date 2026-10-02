"use client";

import Link from "next/link";

import { useCart } from "@/hooks/cart";
import { cn } from "@/lib/utils";

/** Ink "Bag · n" pill. The count appears once the cart has loaded. */
export function BagLink({ className }: { className?: string }) {
  const { items, isSuccess } = useCart();
  const count = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link
      href="/cart"
      aria-label={isSuccess ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag"}
      className={cn(
        "press flex items-center whitespace-nowrap rounded-pill bg-fg font-semibold text-bg",
        className,
      )}
    >
      <span aria-hidden="true">{isSuccess ? `Bag · ${count}` : "Bag"}</span>
    </Link>
  );
}
