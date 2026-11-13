"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

import { usePressOutsideGuard } from "@/hooks/usePressOutsideGuard";
import { cn } from "@/lib/utils";
import { EASE_DRAWER, EASE_OUT } from "@/lib/motion";

/**
 * Radix dialog driven by Motion so the panel can leave the way it came in.
 * The sheet is controlled: AnimatePresence keeps the content mounted while
 * its exit runs, and reopening mid-exit retargets from where it is.
 */
const SheetOpenContext = React.createContext(false);

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <SheetOpenContext value={open}>
      <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
        {children}
      </SheetPrimitive.Root>
    </SheetOpenContext>
  );
}

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

type Side = "top" | "right" | "bottom" | "left";

const HIDDEN: Record<Side, string> = {
  top: "translateY(-100%)",
  right: "translateX(100%)",
  bottom: "translateY(100%)",
  left: "translateX(-100%)",
};

const SHOWN: Record<Side, string> = {
  top: "translateY(0%)",
  right: "translateX(0%)",
  bottom: "translateY(0%)",
  left: "translateX(0%)",
};

const sideClasses: Record<Side, string> = {
  top: "inset-x-0 top-0",
  right: "inset-y-0 right-0 h-full",
  bottom: "inset-x-0 bottom-0",
  left: "inset-y-0 left-0 h-full",
};

type SheetContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  "asChild" | "forceMount"
> & {
  side?: Side;
  overlayClassName?: string;
  /** Another dialog takes over as this one closes: leave at once. */
  handOff?: boolean;
};

// A leaving child keeps the props of its last render, so the hand-off
// reaches the exit through AnimatePresence's `custom`.
const OVERLAY_VARIANTS = {
  exit: (instant: boolean) => ({
    opacity: 0,
    transition: { duration: instant ? 0 : 0.2, ease: EASE_OUT },
  }),
};

const LEAVE_AT_ONCE = { opacity: 1, transition: { duration: 0 } };

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  (
    {
      side = "right",
      className,
      overlayClassName,
      onPointerDownOutside,
      handOff = false,
      children,
      ...props
    },
    ref,
  ) => {
    const open = React.use(SheetOpenContext);
    const guard = usePressOutsideGuard(open);
    const reduceMotion = useReducedMotion();
    const panel = reduceMotion
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2, ease: EASE_OUT },
        }
      : {
          initial: { transform: HIDDEN[side] },
          animate: { transform: SHOWN[side] },
          transition: { duration: 0.42, ease: EASE_DRAWER },
        };
    const leave = reduceMotion
      ? { opacity: 0, transition: panel.transition }
      : { transform: HIDDEN[side], transition: panel.transition };

    return (
      <AnimatePresence custom={handOff}>
        {open ? (
          <SheetPrimitive.Portal forceMount>
            {/* While they leave, the scrim and panel stop catching clicks;
                `!` beats the inline pointer-events Radix sets. */}
            <SheetPrimitive.Overlay forceMount asChild>
              <m.div
                className={cn(
                  "fixed inset-0 z-50 bg-scrim data-[state=closed]:!pointer-events-none",
                  overlayClassName,
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                variants={OVERLAY_VARIANTS}
                exit="exit"
              />
            </SheetPrimitive.Overlay>
            <SheetPrimitive.Content
              forceMount
              asChild
              {...props}
              onPointerDownOutside={(event) => {
                guard.onPointerDownOutside(event);
                onPointerDownOutside?.(event);
              }}
            >
              <m.div
                ref={ref}
                className={cn(
                  "fixed z-50 flex flex-col bg-panel text-fg outline-none data-[state=closed]:!pointer-events-none",
                  sideClasses[side],
                  className,
                )}
                {...panel}
                variants={{
                  exit: (instant: boolean) => (instant ? LEAVE_AT_ONCE : leave),
                }}
                exit="exit"
              >
                {children}
              </m.div>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    );
  },
);
SheetContent.displayName = "SheetContent";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("font-display text-5xl leading-[0.9]", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
