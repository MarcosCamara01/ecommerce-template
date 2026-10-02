"use client";

import { useState } from "react";

import { useThrottleFn } from "ahooks";

import { AddedSheet, type AddedItem } from "@/components/bag/AddedSheet";
import { bumpBag, openBag } from "@/components/bag/bag-ui";
import { flyToBag } from "@/components/bag/fly-to-bag";
import { Button } from "@/components/ui/button";
import { useCartMutation } from "@/hooks/cart";
import { useHydrated } from "@/hooks/useHydrated";
import { useSession } from "@/lib/auth/client";
import {
  type ProductSize,
  type ProductVariant,
  type ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { formatPriceFromEuros } from "@/utils/formatters";

const DESKTOP = "(min-width: 1024px)";

interface AddToCartProps {
  product: ProductWithVariants;
  selectedVariant: ProductVariant;
  size: ProductSize | undefined;
  /** The photo that flies to the bag pill on desktop. */
  flySource: () => HTMLElement | null;
  className?: string;
}

/**
 * Add to bag. Desktop: the photo flies to the Bag pill (600ms), the counter
 * bumps, then the drawer opens. Phones: the "Added" panel rises instead.
 * Each new size or colour starts a fresh "Add" (keyed by the parent).
 */
export function AddToCart({
  product,
  selectedVariant,
  size,
  flySource,
  className,
}: AddToCartProps) {
  const { add: addToCart, isAdding } = useCartMutation();
  const { data: session } = useSession();
  const isHydrated = useHydrated();
  const [added, setAdded] = useState(false);
  const [sheetItem, setSheetItem] = useState<AddedItem | null>(null);

  const { run: throttledAddToCart } = useThrottleFn(
    () => {
      if (!size) return;
      addToCart({ size, variantId: selectedVariant.id });
      // Signed-out visitors get the sign-in toast from the mutation instead.
      if (!session?.user) return;

      const line = { name: product.name, color: selectedVariant.color, size };
      if (window.matchMedia(DESKTOP).matches) {
        void flyToBag(flySource()).then(() => {
          bumpBag();
          setAdded(true);
          window.setTimeout(() => openBag(line), 160);
        });
      } else {
        setSheetItem({
          ...line,
          price: product.price,
          image: selectedVariant.images[0],
        });
      }
    },
    { wait: 300 },
  );

  const price = formatPriceFromEuros(product.price);
  const soldOut = selectedVariant.sizes.length === 0;

  return (
    <>
      <Button
        type="button"
        size="lg"
        disabled={!isHydrated || soldOut || isAdding}
        aria-busy={isAdding || undefined}
        onClick={() => (added ? openBag() : throttledAddToCart())}
        className={cn("w-full", className)}
      >
        {soldOut
          ? "Sold out"
          : added
            ? "Added ✓ — view bag"
            : `Add ${size ?? ""} to bag — ${price}`}
      </Button>
      <AddedSheet
        item={sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => {
          if (!open) setSheetItem(null);
        }}
      />
    </>
  );
}
