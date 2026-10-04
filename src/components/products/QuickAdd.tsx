"use client";

import { useEffect, useRef, useState } from "react";

import { bumpBag, openBag } from "@/components/bag/bag-ui";
import { flyToBag } from "@/components/bag/fly-to-bag";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { useCartMutation } from "@/hooks/cart";
import type {
  ProductSize,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";
import { displayName } from "@/utils/product-name";

/** How long the tick stays on a size after it lands in the bag. */
const DONE_MS = 1600;

/**
 * Quick add for a product card: a glass capsule that rises over the foot of
 * the photo while the card is pointed at or focused, with the sizes of the
 * piece. One click adds that size: the photo flies to the Bag pill, the
 * counter bumps and the drawer opens, as on the product page.
 *
 * The capsule and its ink are fixed colours because it sits on a photo,
 * which is pale in both themes. The sizes are one tab stop; the arrow keys
 * move between them.
 */
export function QuickAdd({
  product,
  variant,
  flySource,
}: {
  product: ProductWithVariants;
  variant: ProductVariant;
  /** The photo that flies to the bag. */
  flySource: () => HTMLElement | null;
}) {
  const { add } = useCartMutation();
  // The size under the pointer or the keyboard: the ink slides to it.
  const [pointed, setPointed] = useState<number | null>(null);
  const [tabStop, setTabStop] = useState(0);
  const [pending, setPending] = useState<ProductSize | null>(null);
  const [done, setDone] = useState<ProductSize | null>(null);
  const doneTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(doneTimer.current), []);

  const sizes = variant.sizes;
  if (sizes.length === 0) return null;
  const name = displayName(product.name);

  const addSize = (size: ProductSize) => {
    if (pending) return;
    setPending(size);
    add(
      { size, variantId: variant.id },
      {
        onSuccess: () => {
          setPending(null);
          setDone(size);
          window.clearTimeout(doneTimer.current);
          doneTimer.current = window.setTimeout(() => setDone(null), DONE_MS);
          void flyToBag(flySource()).then(() => {
            bumpBag();
            window.setTimeout(
              () => openBag({ name, color: variant.color, size }),
              160,
            );
          });
        },
        onError: () => setPending(null),
      },
    );
  };

  return (
    <div
      role="group"
      aria-label={`Quick add ${name}`}
      onPointerLeave={() => setPointed(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPointed(null);
      }}
      onKeyDown={(event) => {
        const step =
          event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (step === 0) return;
        event.preventDefault();
        const next = (tabStop + step + sizes.length) % sizes.length;
        event.currentTarget.querySelectorAll("button")[next]?.focus();
      }}
      className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex h-11 translate-y-3 rounded-pill border border-white/50 bg-white/70 p-1 text-[#111214] opacity-0 shadow-float backdrop-blur-[20px] backdrop-saturate-150 transition-[transform,opacity] duration-200 ease-out group-focus-within/piece:pointer-events-auto group-focus-within/piece:translate-y-0 group-focus-within/piece:opacity-100 group-hover/piece:pointer-events-auto group-hover/piece:translate-y-0 group-hover/piece:opacity-100 group-hover/piece:delay-75 group-hover/piece:duration-350 motion-reduce:translate-y-0"
    >
      {pointed !== null ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 animate-fade-in rounded-pill bg-[#111214] transition-transform duration-220 ease-in-out [animation-duration:150ms] motion-reduce:transition-none"
          style={{
            width: `calc((100% - 8px) / ${sizes.length})`,
            transform: `translateX(${pointed * 100}%)`,
          }}
        />
      ) : null}
      {sizes.map((size, position) => (
        <button
          key={size}
          type="button"
          tabIndex={position === tabStop ? 0 : -1}
          aria-label={`Add ${name}, size ${size}, to bag`}
          aria-busy={pending === size || undefined}
          onPointerEnter={() => setPointed(position)}
          onFocus={() => {
            setPointed(position);
            setTabStop(position);
          }}
          onClick={() => addSize(size)}
          className={cn(
            "relative grid h-full min-w-0 flex-1 place-items-center rounded-pill text-13 font-medium transition-colors duration-150 ease-out",
            pointed === position && "text-white",
          )}
        >
          {/* The sizes arrive one after another, just behind the capsule. */}
          <span
            style={{ "--i": position } as React.CSSProperties}
            className="grid translate-y-1.5 place-items-center opacity-0 transition-[transform,opacity] duration-300 ease-out group-focus-within/piece:translate-y-0 group-focus-within/piece:opacity-100 group-hover/piece:translate-y-0 group-hover/piece:opacity-100 group-hover/piece:[transition-delay:calc(110ms_+_var(--i)_*_30ms)] motion-reduce:translate-y-0"
          >
            {pending === size ? (
              <SVGLoadingIcon className="size-3.5" />
            ) : done === size ? (
              "✓"
            ) : (
              size
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
