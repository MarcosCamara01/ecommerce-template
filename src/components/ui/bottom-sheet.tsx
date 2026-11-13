"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useState } from "react";

import { useFocusReturn } from "@/hooks/useFocusReturn";
import { DRAG_SPRING, EASE_DRAWER, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Apple's scroll-deceleration projection: where a flick would come to rest. */
const project = (velocity: number, rate = 0.998) =>
  ((velocity / 1000) * rate) / (1 - rate);

/** Where and how fast a drag let the sheet go; null when a button closed it. */
type Release = { y: number; v: number } | null;

/**
 * Phone panel that rises from the bottom edge (420ms drawer curve) and
 * leaves the same way. Dragging it down follows the finger; a release
 * projected past 40% of its height dismisses it on a spring that keeps the
 * finger's velocity, anything less springs back (0.5s, bounce 0.2). Under
 * reduced motion a dismissed sheet fades where it was let go. Content
 * taller than the screen scrolls instead, and the sheet does not drag.
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
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [release, setRelease] = useState<Release>(null);
  const [fits, setFits] = useState(true);

  // Motion's drag takes the vertical touch (`touch-action: pan-x`), so the
  // sheet only drags while its content fits; otherwise it scrolls.
  useEffect(() => {
    if (!panel) return;
    const observer = new ResizeObserver(() =>
      setFits(panel.scrollHeight <= panel.clientHeight + 1),
    );
    observer.observe(panel);
    Array.from(panel.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [panel]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panel?.offsetHeight ?? 1;
    if (info.offset.y + project(info.velocity.y) > height * 0.4) {
      setRelease({ y: info.offset.y, v: info.velocity.y });
      onOpenChange(false);
    }
  };

  // A leaving child keeps the props of its last render, so the release
  // reaches its exit through AnimatePresence's `custom`.
  const variants = {
    exit: (released: Release) =>
      reduceMotion
        ? {
            opacity: 0,
            ...(released ? { y: released.y } : {}),
            transition: { opacity: { duration: 0.2 }, y: { duration: 0 } },
          }
        : {
            y: "100%",
            transition: released
              ? { ...DRAG_SPRING, velocity: released.v }
              : { duration: 0.42, ease: EASE_DRAWER },
          },
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence custom={release} onExitComplete={() => setRelease(null)}>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <m.div
                className="fixed inset-0 z-50 bg-black/35 data-[state=closed]:!pointer-events-none"
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
                ref={setPanel}
                className={cn(
                  // Children keep their size, so tall content scrolls instead of squashing.
                  "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-bg px-4 pb-7 pt-2.5 text-fg shadow-[0_-20px_60px_rgba(0,0,0,.3)] outline-none data-[state=closed]:!pointer-events-none [&>*]:shrink-0",
                  className,
                )}
                drag={fits ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.06, bottom: 1 }}
                // Spring back on the shared drag spring (0.5s, bounce 0.2);
                // critically damped under reduced motion, so it never overshoots.
                dragTransition={
                  reduceMotion
                    ? { bounceStiffness: 600, bounceDamping: 60 }
                    : { bounceStiffness: 158, bounceDamping: 20 }
                }
                onDragEnd={onDragEnd}
                initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
                animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
                variants={variants}
                exit="exit"
                transition={{ duration: 0.42, ease: EASE_DRAWER }}
              >
                {/* Hidden, not removed, when the sheet scrolls: removing it
                    would change what fits and flip the measure back. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-[5px] w-10 self-center rounded-pill bg-fg/25",
                    !fits && "invisible",
                  )}
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
