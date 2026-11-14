import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type SpinnerProps = React.ComponentPropsWithoutRef<"span">;

/** Ring spinner from CStates. */
export const Spinner = forwardRef<React.ElementRef<"span">, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn(
          "inline-block size-4 shrink-0 animate-spin rounded-pill border-2 border-current border-t-transparent [animation-duration:800ms]",
          className,
        )}
        {...props}
      />
    );
  },
);

Spinner.displayName = "Spinner";
