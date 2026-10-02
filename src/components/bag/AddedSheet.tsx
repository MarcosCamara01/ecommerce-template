"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m, useReducedMotion, type PanInfo } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import { ButtonCheckout } from "@/components/cart/ButtonCheckout";
import { useCartDetails } from "@/hooks/cart";
import { DRAG_SPRING, EASE_DRAWER, EASE_OUT } from "@/lib/motion";
import { formatPriceFromEuros } from "@/utils/formatters";

export type AddedItem = {
  name: string;
  color: string;
  size: string;
  price: number;
  image: string;
};

/** Apple's scroll-deceleration projection: where a flick would come to rest. */
const project = (velocity: number, rate = 0.998) =>
  ((velocity / 1000) * rate) / (1 - rate);

/**
 * Phone confirmation after Add to bag. It rises from the bottom edge
 * (420ms drawer curve); dragging the panel down follows the finger, and a
 * release projected past 40% of its height dismisses it on a spring that
 * keeps the finger's velocity. Otherwise it springs back.
 */
export function AddedSheet({
  item,
  open,
  onOpenChange,
}: {
  item: AddedItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [releaseVelocity, setReleaseVelocity] = useState<number | null>(null);
  const { items } = useCartDetails();
  const pieces = items.reduce((total, line) => total + line.quantity, 0);
  const subtotal = items.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight ?? 1;
    if (info.offset.y + project(info.velocity.y) > height * 0.4) {
      setReleaseVelocity(info.velocity.y);
      onOpenChange(false);
    }
  };

  const exitTransition =
    releaseVelocity !== null
      ? { ...DRAG_SPRING, velocity: releaseVelocity }
      : { duration: 0.42, ease: EASE_DRAWER };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setReleaseVelocity(null);
        onOpenChange(next);
      }}
    >
      <AnimatePresence>
        {open && item ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <m.div
                className="fixed inset-0 z-50 bg-black/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              />
            </Dialog.Overlay>
            <Dialog.Content forceMount asChild aria-describedby={undefined}>
              <m.div
                ref={panelRef}
                className="fixed inset-x-0 bottom-0 z-50 flex touch-none flex-col gap-4 rounded-t-[28px] bg-bg px-4 pb-7 pt-2.5 text-fg shadow-[0_-20px_60px_rgba(0,0,0,.3)] outline-none"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.06, bottom: 1 }}
                // Spring back with the shared drag spring (0.5s, bounce 0.2).
                dragTransition={{ bounceStiffness: 158, bounceDamping: 20 }}
                onDragEnd={onDragEnd}
                initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: { duration: 0.2 } }
                    : { y: "100%", transition: exitTransition }
                }
                transition={{ duration: 0.42, ease: EASE_DRAWER }}
              >
                <span
                  aria-hidden="true"
                  className="h-[5px] w-10 self-center rounded-pill bg-fg/25"
                />
                <Dialog.Title className="font-display text-[44px] leading-[0.9]">
                  Added
                </Dialog.Title>
                <div className="stagger-in grid grid-cols-[64px_1fr_auto] items-center gap-3">
                  <Image
                    src={item.image}
                    alt=""
                    width={64}
                    height={82}
                    sizes="64px"
                    className="h-[82px] w-16 rounded-[14px] bg-photo object-cover"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-13">
                      {item.color} · {item.size}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatPriceFromEuros(item.price)}
                  </span>
                </div>
                {pieces > 0 ? (
                  <div className="flex justify-between text-sm tabular-nums">
                    <span>
                      Bag · {pieces} {pieces === 1 ? "piece" : "pieces"}
                    </span>
                    <span>{formatPriceFromEuros(subtotal)}</span>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Dialog.Close className="press h-14 grow rounded-pill border border-fg font-medium">
                    Keep shopping
                  </Dialog.Close>
                  <ButtonCheckout
                    cartItemIds={items.map((line) => line.id)}
                    className="h-14 grow"
                  />
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
