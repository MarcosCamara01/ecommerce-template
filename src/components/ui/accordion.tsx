"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { LuPlus } from "react-icons/lu";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-line", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    headingLevel?: 2 | 3 | 4;
  }
>(({ className, children, headingLevel = 3, ...props }, ref) => {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <AccordionPrimitive.Header asChild>
      <Heading className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex min-h-14 flex-1 items-center justify-between text-left text-sm font-medium [&[data-state=open]>svg]:rotate-45",
            className
          )}
          {...props}
        >
          {children}
          <LuPlus
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform duration-220 ease-in-out motion-reduce:transition-none"
          />
        </AccordionPrimitive.Trigger>
      </Heading>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & { forceMount?: true }
>(({ className, children, forceMount, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    forceMount={forceMount}
    className={cn(
      "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none",
      forceMount && "data-[state=closed]:hidden"
    )}
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
