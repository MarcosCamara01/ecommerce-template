"use client";

import { useState, useSyncExternalStore } from "react";
/** FUNCTIONALITY */
import { useWishlist } from "@/hooks/wishlist";
import { useThrottleFn } from "ahooks";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
/** ICONS */
import { HeartIcon } from "@/components/icons";
/** COMPONENTS */
import { Skeleton } from "@/components/ui/skeleton";
/** TYPES */
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";
import { useWishlistMutation } from "@/hooks/wishlist/mutations/useWishlistMutation";

/**
 * - `disc`: white disc on a product photo (cards, mobile gallery).
 * - `outline`: 64px ring next to Add to bag on the product page.
 */
type Appearance = "disc" | "outline";

const sizes: Record<Appearance, { box: string; icon: number; spark: number }> = {
  disc: { box: "size-10", icon: 16, spark: 32 },
  outline: { box: "size-16", icon: 22, spark: 46 },
};

interface WishlistButtonProps {
  productId: ProductWithVariants["id"];
  productName: string;
  appearance?: Appearance;
  className?: string;
}

const subscribeToHydration = () => () => undefined;

const SPARK_ANGLES = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (Math.PI * 2 * i) / 8);

const WishlistButton = ({
  productId,
  productName,
  appearance = "disc",
  className,
}: WishlistButtonProps) => {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const { data: session } = useSession();
  const { isInWishlist, isLoading } = useWishlist();
  const { remove: removeFromWishlist, add: addToWishlist } =
    useWishlistMutation();
  // Each save replays the celebration; removing never does.
  const [celebration, setCelebration] = useState(0);

  const isFavorite = isInWishlist(productId);
  const size = sizes[appearance];

  const { run: throttledToggle } = useThrottleFn(
    () => {
      if (isFavorite) {
        removeFromWishlist({ productId });
        return;
      }
      addToWishlist(productId);
      if (session?.user) setCelebration((count) => count + 1);
    },
    {
      wait: 300,
    },
  );

  if (!isHydrated || isLoading) {
    return (
      <Skeleton
        className={cn(
          size.box,
          appearance === "disc" && "bg-white/85",
          className,
        )}
      />
    );
  }

  return (
    <span className={cn("relative grid shrink-0", size.box, className)}>
      {celebration > 0 ? (
        <span key={celebration} aria-hidden="true">
          {SPARK_ANGLES.map((angle) => (
            <span
              key={angle}
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 animate-spark rounded-pill opacity-0",
                appearance === "disc" ? "bg-[#111214]" : "bg-fg",
              )}
              style={
                {
                  "--dx": `${Math.round(Math.cos(angle) * size.spark)}px`,
                  "--dy": `${Math.round(Math.sin(angle) * size.spark)}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
      <button
        type="button"
        onClick={throttledToggle}
        aria-pressed={isFavorite}
        aria-label={`Save ${productName} to wishlist`}
        className={cn(
          "press relative grid size-full place-items-center rounded-pill transition-[background-color,color,transform] duration-200",
          appearance === "disc" &&
            (isFavorite ? "bg-[#111214] text-white" : "bg-white/85 text-[#111214]"),
          appearance === "outline" &&
            (isFavorite ? "bg-fg text-bg" : "border border-line text-fg"),
        )}
      >
        <span
          key={celebration}
          className={cn("grid", celebration > 0 && isFavorite && "animate-pop")}
        >
          <HeartIcon size={size.icon} filled={isFavorite} />
        </span>
      </button>
    </span>
  );
};

export default WishlistButton;
