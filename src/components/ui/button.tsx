import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "press inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-pill font-semibold transition-[transform,background-color,color,opacity] duration-120 ease-out disabled:pointer-events-none disabled:opacity-65",
  {
    variants: {
      variant: {
        default: "bg-fg text-bg hover:bg-hover",
        secondary:
          "border border-fg bg-transparent font-medium text-fg hover:bg-card",
        outline:
          "border border-line bg-transparent font-medium text-fg hover:border-fg",
        ghost: "bg-transparent font-medium text-fg hover:bg-card",
        link: "h-auto rounded-none px-0 font-medium text-fg underline underline-offset-[3px] hover:opacity-80",
        destructive: "bg-err-line text-white hover:opacity-90",
      },
      size: {
        default: "h-14 px-[26px] text-[15px]",
        lg: "h-16 px-8 text-base",
        sm: "h-12 px-[22px] text-[15px]",
        xs: "h-10 px-4 text-sm",
        icon: "size-12",
        "icon-sm": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
