"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { useFocusReturn } from "@/hooks/useFocusReturn";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** How much a click enlarges the photo on screen. */
const ZOOM = 2;

const control =
  "press grid size-11 place-items-center rounded-pill bg-white/80 text-[#111214] backdrop-blur-sm";

/** Keeps the point under the pointer in place while the photo is enlarged. */
function follow(event: React.MouseEvent<HTMLButtonElement>) {
  const photo = event.currentTarget.querySelector("img");
  if (!photo) return;
  const box = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * 100;
  const y = ((event.clientY - box.top) / box.height) * 100;
  photo.style.transformOrigin = `${x}% ${y}%`;
}

const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    className={back ? undefined : "rotate-180"}
  >
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/**
 * The photos of a colour, one at a time, as large as the window allows. It
 * opens on the photo that was pressed, over Photo Ground, so a studio shot
 * runs into the page without a frame.
 *
 * - Swipe, the arrows, the thumbnails or the arrow keys change photo.
 * - With a mouse, a click enlarges the photo twice over and it follows the
 *   pointer; another click sets it back. Touch screens pinch as usual.
 * - Escape or the cross closes it and focus returns to the photo it came from.
 */
export function PhotoViewer({
  name,
  color,
  images,
  openAt,
  onClose,
}: {
  name: string;
  color: string;
  images: string[];
  /** The photo to open on, or null while closed. */
  openAt: number | null;
  onClose: () => void;
}) {
  const focusReturn = useFocusReturn();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;

  // Opens on the photo that was pressed.
  const openStage = useCallback(
    (stage: HTMLDivElement | null) => {
      stageRef.current = stage;
      if (!stage || openAt === null) return;
      stage.scrollLeft = openAt * stage.clientWidth;
      setIndex(openAt);
      setZoomed(false);
    },
    [openAt],
  );

  const show = (next: number, smooth: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    const target = Math.min(count - 1, Math.max(0, next));
    setZoomed(false);
    stage.scrollTo({
      left: target * stage.clientWidth,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  };

  return (
    <DialogPrimitive.Root
      open={openAt !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          {...focusReturn}
          onKeyDown={(event) => {
            // Keys change photo at once: no glide for a keyboard.
            if (event.key === "ArrowRight") show(index + 1, false);
            if (event.key === "ArrowLeft") show(index - 1, false);
          }}
          className="fixed inset-0 z-50 bg-photo text-[#111214] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] data-[state=closed]:[animation-duration:150ms] data-[state=open]:[animation-duration:200ms] motion-reduce:zoom-in-100 motion-reduce:zoom-out-100"
        >
          <DialogPrimitive.Title className="sr-only">
            {name} in {color}, photos
          </DialogPrimitive.Title>

          <div
            ref={openStage}
            onScroll={(event) => {
              const { scrollLeft, clientWidth } = event.currentTarget;
              setIndex(Math.round(scrollLeft / clientWidth));
            }}
            className={cn(
              "flex size-full snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none]",
              zoomed ? "overflow-hidden" : "overflow-x-auto",
            )}
          >
            {images.map((image, slide) => {
              const enlarged = zoomed && slide === index;
              return (
                <button
                  key={image}
                  type="button"
                  // Enlarging is for a pointer that can hover; a finger pinches.
                  onClick={(event) => {
                    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                    follow(event);
                    setZoomed((value) => !value);
                  }}
                  onMouseMove={enlarged ? follow : undefined}
                  aria-label={
                    enlarged
                      ? `Photo ${slide + 1} of ${count}, enlarged. Set it back`
                      : `Photo ${slide + 1} of ${count}. Enlarge`
                  }
                  className={cn(
                    "relative h-full min-w-full snap-start overflow-hidden",
                    enlarged
                      ? "cursor-zoom-out"
                      : "[@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-in",
                  )}
                >
                  <Image
                    fill
                    src={image}
                    alt={`${name} in ${color}, photo ${slide + 1} of ${count}`}
                    sizes="100vw"
                    quality={90}
                    priority={slide === openAt}
                    className="object-contain transition-transform duration-300 ease-out motion-reduce:transition-none"
                    style={enlarged ? { transform: `scale(${ZOOM})` } : undefined}
                  />
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3 lg:inset-x-6 lg:top-6">
            <span className="rounded-pill bg-white/80 px-4 py-3 text-13 font-medium tabular-nums backdrop-blur-sm">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <DialogPrimitive.Close
              aria-label="Close photos"
              className={cn(control, "pointer-events-auto")}
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </DialogPrimitive.Close>
          </div>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                disabled={index === 0}
                onClick={() => show(index - 1, true)}
                className={cn(
                  control,
                  "absolute left-6 top-1/2 size-[52px] -translate-y-1/2 transition-opacity duration-200 disabled:opacity-0 max-lg:hidden",
                )}
              >
                <Arrow back />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                disabled={index === count - 1}
                onClick={() => show(index + 1, true)}
                className={cn(
                  control,
                  "absolute right-6 top-1/2 size-[52px] -translate-y-1/2 transition-opacity duration-200 disabled:opacity-0 max-lg:hidden",
                )}
              >
                <Arrow />
              </button>

              <div
                role="group"
                aria-label="Photos"
                className="absolute bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 gap-1.5 rounded-chip bg-white/80 p-1.5 backdrop-blur-sm lg:bottom-6"
              >
                {images.map((image, thumb) => (
                  <button
                    key={image}
                    type="button"
                    aria-label={`Photo ${thumb + 1}`}
                    aria-current={thumb === index}
                    onClick={() => show(thumb, true)}
                    className="press relative h-[58px] w-11 overflow-hidden rounded-[14px] opacity-60 transition-opacity duration-200 aria-[current=true]:opacity-100 aria-[current=true]:shadow-[0_0_0_1.5px_#111214]"
                  >
                    <Image fill src={image} alt="" sizes="44px" className="object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
