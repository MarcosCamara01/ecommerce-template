"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m, useReducedMotion, type PanInfo } from "motion/react";
import { useRef, useState } from "react";

import { useFocusReturn } from "@/hooks/useFocusReturn";
import { DRAG_SPRING, EASE_DRAWER, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Apple's scroll-deceleration projection: where a flick would come to rest. */
const project = (velocity: number, rate = 0.998) =>
  ((velocity / 1000) * rate) / (1 - rate);

/**
 * Phone panel that rises from the bottom edge (420ms drawer curve) and
 * leaves the same way. Dragging it down follows the finger; a release
 * projected past 40% of its height dismisses it on a spring that keeps the
 * finger's velocity, anything less springs back (0.5s, bounce 0.2).
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  titleClassName,
  description,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  titleClassName?: string;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const focusReturn = useFocusReturn();
  const panelRef = useRef<HTMLDivElement>(null);
  const [releaseVelocity, setReleaseVelocity] = useState<number | null>(null);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight ?? 1;
    if (info.offset.y + project(info.velocity.y) > height * 0.4) {
      setReleaseVelocity(info.velocity.y);
      onOpenChange(false);
    }
  };

  const exit = reduceMotion
    ? { opacity: 0, transition: { duration: 0.2 } }
    : {
        y: "100%",
        transition:
          releaseVelocity !== null
            ? { ...DRAG_SPRING, velocity: releaseVelocity }
            : { duration: 0.42, ease: EASE_DRAWER },
      };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setReleaseVelocity(null);
        onOpenChange(next);
      }}
    >
      <AnimatePresence>
        {open ? (
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
            <Dialog.Content
              forceMount
              asChild
              {...focusReturn}
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <m.div
                ref={panelRef}
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-bg px-4 pb-7 pt-2.5 text-fg shadow-[0_-20px_60px_rgba(0,0,0,.3)] outline-none",
                  className,
                )}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.06, bottom: 1 }}
                // Spring back on the shared drag spring (0.5s, bounce 0.2).
                dragTransition={{ bounceStiffness: 158, bounceDamping: 20 }}
                onDragEnd={onDragEnd}
                initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={exit}
                transition={{ duration: 0.42, ease: EASE_DRAWER }}
              >
                <span
                  aria-hidden="true"
                  className="h-[5px] w-10 shrink-0 self-center rounded-pill bg-fg/25"
                />
                <Dialog.Title
                  className={cn("font-display text-[44px] leading-[0.9]", titleClassName)}
                >
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-muted">
                    {description}
                  </Dialog.Description>
                ) : null}
                {children}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export const BottomSheetClose = Dialog.Close;
