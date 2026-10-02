import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type SpinnerProps = React.ComponentPropsWithoutRef<"span"> & {
  width?: number;
  height?: number;
};

/** Ring spinner from CStates: currentColor with a transparent top, 0.8s. */
export const SVGLoadingIcon = forwardRef<React.ElementRef<"span">, SpinnerProps>(
  ({ className, width, height, style, ...props }, ref) => {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn(
          "inline-block size-4 shrink-0 animate-spin rounded-pill border-2 border-current border-t-transparent [animation-duration:800ms]",
          className,
        )}
        style={{ width, height, ...style }}
        {...props}
      />
    );
  },
);

SVGLoadingIcon.displayName = "SVGLoadingIcon";
