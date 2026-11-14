"use client";

import { useState, useSyncExternalStore } from "react";
import { useWishlist, useWishlistMutation } from "@/hooks/wishlist";
import { useThrottleFn } from "ahooks";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { HeartIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";

/**
 * - `disc`: white disc on a product photo (cards, mobile gallery).
 * - `outline`: 64px ring next to Add to bag on the product page.
 */
type Appearance = "disc" | "outline";

/** Sparks start just past the rim and travel out to `spark` (px from the centre). */
const sizes: Record<Appearance, { box: string; icon: number; spark: number; rim: number }> = {
  disc: { box: "size-10", icon: 16, spark: 36, rim: 21 },
  outline: { box: "size-16", icon: 22, spark: 46, rim: 32 },
};

interface WishlistButtonProps {
  productId: ProductWithVariants["id"];
  productName: string;
  appearance?: Appearance;
  /** On the wishlist page a saved piece shows a plain cross instead. */
  showsRemove?: boolean;
  className?: string;
}

const subscribeToHydration = () => () => undefined;

const SPARK_ANGLES = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (Math.PI * 2 * i) / 8);

export const WishlistButton = ({
  productId,
  productName,
  appearance = "disc",
  showsRemove = false,
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
        // Removing is instant and quiet, with a way back. The toast is
        // raised here, not in a mutate callback: on the wishlist page the
        // card unmounts with the removal and its callbacks never run.
        removeFromWishlist({ productId });
        toast("Removed from wishlist", {
          action: { label: "Undo", onClick: () => addToWishlist(productId) },
        });
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
        // Out of flow: as a grid item it would take a row of its own and
        // squash the button for good after the first save.
        <span
          key={celebration}
          aria-hidden="true"
          // Once the sparks have flown the celebration is over: a listing
          // re-shown from <Activity> must not play it again.
          onAnimationEnd={(event) => {
            const running = event.currentTarget
              .getAnimations({ subtree: true })
              .some((animation) => animation.playState === "running");
            if (!running) setCelebration(0);
          }}
          className="pointer-events-none absolute inset-0"
        >
          {SPARK_ANGLES.map((angle, index) => {
            // Every other spark travels a little less and leaves a little later.
            const far = index % 2 ? 0.85 : 1;
            return (
              <span
                key={angle}
                className={cn(
                  "pointer-events-none absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 animate-spark rounded-pill opacity-0",
                  appearance === "disc" ? "bg-[#111214]" : "bg-fg",
                )}
                style={
                  {
                    "--x0": `${Math.round(Math.cos(angle) * size.rim)}px`,
                    "--y0": `${Math.round(Math.sin(angle) * size.rim)}px`,
                    "--dx": `${Math.round(Math.cos(angle) * size.spark * far)}px`,
                    "--dy": `${Math.round(Math.sin(angle) * size.spark * far)}px`,
                    animationDelay: index % 2 ? "110ms" : undefined,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </span>
      ) : null}
      <button
        type="button"
        onClick={throttledToggle}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `Remove ${productName} from wishlist`
            : `Save ${productName} to wishlist`
        }
        className={cn(
          "press relative grid size-full place-items-center rounded-pill [transition:background-color_200ms_var(--ease-out),color_200ms_var(--ease-out),transform_120ms_var(--ease-out)]",
          appearance === "disc" &&
            (isFavorite && !showsRemove
              ? "bg-[#111214] text-white focus-visible:outline-[#111214]"
              : "bg-white/85 text-[#111214] focus-visible:outline-[#111214]"),
          appearance === "outline" &&
            (isFavorite ? "bg-fg text-bg" : "border border-line text-fg"),
        )}
      >
        <span
          key={celebration}
          className={cn("grid", celebration > 0 && isFavorite && "animate-pop")}
        >
          {showsRemove && isFavorite ? (
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <HeartIcon size={size.icon} filled={isFavorite} />
          )}
        </span>
      </button>
    </span>
  );
};
