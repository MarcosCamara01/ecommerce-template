"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { useRef, useState } from "react";

import type { ProductVariant, ProductWithVariants } from "@/lib/db/drizzle/schema";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { wrap } from "./useHeroRotation";

type DeckPiece = {
  product: ProductWithVariants;
  variant: ProductVariant;
};

/** Horizontal travel (px) or release speed (px/ms) that turns a drag into a swipe. */
const SWIPE_DISTANCE = 56;
const SWIPE_SPEED = 0.5;

/** The release speed is read over the finger's moves in this window. */
const RELEASE_WINDOW_MS = 80;

type Gesture = {
  pointer: number;
  card: HTMLElement;
  /** Finger x at touch-down: the swipe distance counts from here. */
  down: number;
  /** Set once the finger passes the 10px slop: where it was then, and how
   *  the card was drawn, since it may have been caught mid-flight. */
  taken: { x: number; drawn: { x: number; y: number; angle: number; scale: number } } | null;
  /** The finger's latest positions, for the release speed. */
  samples: { x: number; t: number }[];
};

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
 * retarget instead of restarting. On touch the front card can be swiped:
 * it is taken from wherever it is drawn, the swipe stops the rotation, and
 * a card thrown away carries on the way it was thrown.
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
  const drag = useRef<Gesture | null>(null);
  const swiped = useRef(false);
  // Once the first-load settle has played its class goes, so a page re-shown
  // from <Activity> does not settle the cards again.
  const [settled, setSettled] = useState(false);

  const endDrag = (event: React.PointerEvent, cancelled: boolean) => {
    const gesture = drag.current;
    if (!gesture || gesture.pointer !== event.pointerId) return;
    drag.current = null;
    const { card, taken, samples } = gesture;
    if (!taken) return;
    const travel = event.clientX - gesture.down;
    const offset = taken.drawn.x + event.clientX - taken.x;
    // Speed over the last moves, not the average since touch-down: a finger
    // that rested before flicking still flicks; one that stopped before
    // lifting does not.
    const last = samples[samples.length - 1];
    const from = samples.find((sample) => last.t - sample.t <= RELEASE_WINDOW_MS) ?? last;
    const still = event.timeStamp - last.t > RELEASE_WINDOW_MS;
    const velocity = !still && last.t > from.t ? (last.x - from.x) / (last.t - from.t) : 0;
    const fling = Math.abs(velocity) > SWIPE_SPEED;
    const swipe = !cancelled && (fling || Math.abs(travel) > SWIPE_DISTANCE);
    const direction = Math.sign(fling ? velocity : travel);
    swiped.current = true;

    if (swipe && direction < 0) {
      // The card carries on the way it was thrown while it fades; under
      // reduced motion it fades where it was let go.
      const reduce = prefersReducedMotion();
      if (reduce) {
        card.style.transition = "opacity 200ms var(--ease-out)";
      } else {
        const exitX = Math.min(offset + velocity * 160, offset - 40, -0.42 * card.offsetWidth);
        card.style.transition = "transform 450ms var(--ease-out), opacity 250ms var(--ease-out)";
        card.style.transform = `translate(${exitX}px, ${taken.drawn.y}px) rotate(${exitX / 24}deg) scale(0.95)`;
      }
      // Once it is out of sight its class takes it to its hidden place.
      // transitionend fires per property, so wait for the one that ends last.
      const ended = (end: TransitionEvent) => {
        if (end.propertyName === (reduce ? "opacity" : "transform")) release();
      };
      const release = () => {
        card.removeEventListener("transitionend", ended);
        card.style.transition = "";
        card.style.transform = "";
      };
      card.addEventListener("transitionend", ended);
      window.setTimeout(release, 600);
      onShift(1);
      return;
    }

    // Snap back, or back to the previous piece: the class takes it from
    // where it was let go.
    card.style.transition = "";
    card.style.transform = "";
    if (swipe) onShift(-1);
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-hero-claim=""
      onAnimationEnd={(event) => {
        if (!settle || settled) return;
        // Only CSS animations: the slots' transform transitions do not count.
        const busy = event.currentTarget
          .getAnimations({ subtree: true })
          .some((animation) => animation instanceof CSSAnimation && animation.playState === "running");
        if (!busy) setSettled(true);
      }}
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
        const card = event.currentTarget.querySelector<HTMLElement>('[data-deck-slot="0"]');
        if (!card) return;
        drag.current = {
          pointer: event.pointerId,
          card,
          down: event.clientX,
          taken: null,
          samples: [{ x: event.clientX, t: event.timeStamp }],
        };
      }}
      onPointerMove={(event) => {
        const gesture = drag.current;
        if (!gesture || gesture.pointer !== event.pointerId) return;
        gesture.samples = [...gesture.samples.slice(-4), { x: event.clientX, t: event.timeStamp }];
        if (!gesture.taken) {
          if (Math.abs(event.clientX - gesture.down) < 10) return;
          // The visitor has taken over, so the rotation stops: it can no
          // longer change the piece under the finger.
          onShift(0);
          // Take the card where it is drawn and track from this point, so
          // neither the slop nor a card caught mid-flight jumps.
          const matrix = new DOMMatrixReadOnly(getComputedStyle(gesture.card).transform);
          gesture.taken = {
            x: event.clientX,
            drawn: {
              x: matrix.m41,
              y: matrix.m42,
              angle: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
              scale: Math.hypot(matrix.a, matrix.b),
            },
          };
          gesture.card.style.transition = "none";
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        const { x, drawn } = gesture.taken;
        const moved = event.clientX - x;
        gesture.card.style.transform = `translate(${drawn.x + moved}px, ${drawn.y}px) rotate(${drawn.angle + moved / 24}deg) scale(${drawn.scale})`;
      }}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      className="absolute left-1/2 top-[70px] aspect-[2/3] w-64 -translate-x-1/2 touch-pan-y select-none [-webkit-touch-callout:none] lg:top-[calc(var(--hero-u)*150)] lg:w-[min(30vw,calc(var(--hero-u)*432))]"
    >
      {slots.map((slot) => {
        const place = step + slot;
        const { product, variant } = pieces[wrap(place, count)];
        const queued = slot >= 1 && slot <= queue;
        // The cards on screen at first load settle in from front to back.
        const settles = settle && !settled && place >= 0 && place <= queue;
        return (
          <div
            key={place}
            data-deck-slot={slot}
            className={cn(
              // Under reduced motion one timing with the details' 450ms fade.
              "absolute inset-0 transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-opacity motion-reduce:duration-450 motion-reduce:ease-out",
              placement(slot, queue),
            )}
          >
            <div
              className={cn(
                "size-full overflow-hidden rounded-photo bg-photo shadow-hero lg:rounded-photo-lg",
                settles && "animate-fade-scale motion-reduce:![animation-delay:0ms]",
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
