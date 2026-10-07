"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { useRef } from "react";

import type { ProductVariant, ProductWithVariants } from "@/lib/db/drizzle/schema";
import { cn } from "@/lib/utils";

import { wrap } from "./useHeroRotation";

type DeckPiece = {
  product: ProductWithVariants;
  variant: ProductVariant;
};

/** Horizontal travel (px) or speed (px/ms) that turns a drag into a swipe. */
const SWIPE_DISTANCE = 56;
const SWIPE_SPEED = 0.5;

/** How many of the next pieces show behind the front one. */
const QUEUE = 2;

const HIDDEN = "pointer-events-none opacity-0";

/**
 * Where a card sits, by how many pieces it is away from the front one.
 * Cards that left wait on the left, the ones still to come on the right;
 * under reduced motion the one that left fades out where it stood.
 */
function placement(slot: number, queue: number) {
  if (slot < 0) {
    return cn(
      HIDDEN,
      "z-40 -translate-x-[42%] -rotate-6 scale-95 motion-reduce:translate-x-0 motion-reduce:rotate-0 motion-reduce:scale-100",
    );
  }
  if (slot === 0) return "z-30";
  if (slot === 1 && queue >= 1) {
    return "z-20 translate-x-[58%] translate-y-[2%] rotate-[5deg] scale-[0.78]";
  }
  if (slot === 2 && queue >= 2) {
    // Phones only have room for the next piece to peek in.
    return "z-10 translate-x-[102%] translate-y-[4%] rotate-[9deg] scale-[0.6] max-lg:opacity-0";
  }
  return cn(HIDDEN, "translate-x-[132%] translate-y-[5%] rotate-[12deg] scale-50");
}

/**
 * The hero photos as a deck: the current piece upright in front, the next
 * ones fanned out to its right. A change of piece slides every card one
 * place along (transform and opacity, 700ms ease-out), so rapid changes
 * retarget instead of restarting. On touch the front card can be swiped.
 */
export function HeroDeck({
  pieces,
  step,
  settle,
  onShift,
  ref,
}: {
  pieces: readonly DeckPiece[];
  /** Number of the piece in front; it only counts up or down, never wraps. */
  step: number;
  /** First load of the session: the cards settle in one after another. */
  settle: boolean;
  onShift: (delta: number) => void;
  ref: React.Ref<HTMLDivElement>;
}) {
  const count = pieces.length;
  const queue = Math.min(QUEUE, count - 1);
  // The furthest a card travels in one change: a click on the last queued
  // card, or a jump the shortest way round. Cards that far out stay mounted
  // (hidden) so they can slide instead of popping in or out.
  const reach = Math.max(queue, Math.floor(count / 2));
  const slots = Array.from(
    { length: queue + 2 * reach + 1 },
    (_, position) => position - reach,
  );
  const drag = useRef<{
    pointer: number;
    x: number;
    at: number;
    card: HTMLElement | null;
    active: boolean;
  } | null>(null);
  const swiped = useRef(false);

  const endDrag = (event: React.PointerEvent, cancelled: boolean) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    drag.current = null;
    if (!gesture.active || !gesture.card) return;
    const travel = event.clientX - gesture.x;
    const speed = travel / Math.max(event.timeStamp - gesture.at, 1);
    // Hand the card back to its class: it carries on from where it was let go.
    gesture.card.style.transition = "";
    gesture.card.style.transform = "";
    swiped.current = true;
    if (
      !cancelled &&
      (Math.abs(travel) > SWIPE_DISTANCE || Math.abs(speed) > SWIPE_SPEED)
    ) {
      onShift(travel < 0 ? 1 : -1);
    }
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-hero-claim=""
      onClickCapture={(event) => {
        if (!swiped.current) return;
        // The click that ends a swipe is not a tap on the photo.
        swiped.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        swiped.current = false;
        if (event.pointerType === "mouse" || count < 2) return;
        drag.current = {
          pointer: event.pointerId,
          x: event.clientX,
          at: event.timeStamp,
          card: event.currentTarget.querySelector<HTMLElement>(
            '[data-deck-slot="0"]',
          ),
          active: false,
        };
      }}
      onPointerMove={(event) => {
        const gesture = drag.current;
        if (!gesture?.card || gesture.pointer !== event.pointerId) return;
        const travel = event.clientX - gesture.x;
        if (!gesture.active) {
          if (Math.abs(travel) < 10) return;
          gesture.active = true;
          gesture.card.style.transition = "none";
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        gesture.card.style.transform = `translateX(${travel}px) rotate(${travel / 24}deg)`;
      }}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      className="absolute left-1/2 top-[70px] aspect-[2/3] w-64 -translate-x-1/2 touch-pan-y select-none lg:top-[calc(var(--hero-u)*150)] lg:w-[min(30vw,calc(var(--hero-u)*432))]"
    >
      {slots.map((slot) => {
        const place = step + slot;
        const { product, variant } = pieces[wrap(place, count)];
        const queued = slot >= 1 && slot <= queue;
        // The cards on screen at first load settle in from front to back.
        const settles = settle && place >= 0 && place <= queue;
        return (
          <div
            key={place}
            data-deck-slot={slot}
            className={cn(
              "absolute inset-0 transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-opacity",
              placement(slot, queue),
            )}
          >
            <div
              className={cn(
                "size-full overflow-hidden rounded-photo bg-photo shadow-hero lg:rounded-photo-lg",
                settles && "animate-fade-scale",
              )}
              style={settles ? { animationDelay: `${200 + place * 120}ms` } : undefined}
            >
              <Image
                src={variant.images[0] ?? product.img}
                alt=""
                width={440}
                height={660}
                priority={place === 0}
                draggable={false}
                sizes="(max-width: 1023px) 256px, 30vw"
                className="size-full object-cover"
              />
            </div>
            {slot === 0 ? (
              <Link
                href={`/${product.category}/${product.id}?variant=${encodeURIComponent(variant.color)}`}
                tabIndex={-1}
                draggable={false}
                className="absolute inset-0"
              />
            ) : queued ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onShift(slot)}
                className="absolute inset-0 cursor-pointer"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
