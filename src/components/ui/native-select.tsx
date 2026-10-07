import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const nativeSelectVariants = cva(
  "w-full min-w-0 appearance-none rounded-pill border bg-transparent text-fg transition-[border-color,box-shadow] duration-120 ease-out focus-visible:border-fg focus-visible:shadow-[0_0_0_4px_var(--ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-65 aria-[invalid=true]:border-err-line",
  {
    variants: {
      variant: {
        hero: "press h-14 border-fg pl-[18px] pr-[22px] font-medium",
        compact: "h-11 border-line pl-[14px] pr-5 text-sm",
      },
    },
    defaultVariants: { variant: "compact" },
  },
);

function NativeSelect({
  className,
  variant = "compact",
  ...props
}: React.ComponentProps<"select"> & VariantProps<typeof nativeSelectVariants>) {
  return (
    <div className="relative w-full" data-slot="native-select-wrapper">
      <select
        data-slot="native-select"
        data-variant={variant}
        className={cn(nativeSelectVariants({ variant }), className)}
        {...props}
      />
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 select-none",
          variant === "hero" ? "right-4 text-xs" : "right-3 text-[10px]",
        )}
        aria-hidden="true"
        data-slot="native-select-icon"
      >
        ▾
      </span>
    </div>
  );
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOption };
