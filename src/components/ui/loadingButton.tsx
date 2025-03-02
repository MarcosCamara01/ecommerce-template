import React, { forwardRef } from "react";
import { ButtonProps, Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

const SVGLoadingIcon = React.forwardRef<
  React.ElementRef<"svg">,
  React.ComponentPropsWithoutRef<"svg">
>(({ className }, ref) => {
  return (
    <svg
      className={cn("-ml-1 mr-3 h-4 w-4 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
});

SVGLoadingIcon.displayName = "SVGLoadingIcon";

type LoadingButtonProps = ButtonProps & {
  loading: boolean;
  children: React.ReactNode;
};

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, ...props }, ref) => {
    return (
      <Button {...props} ref={ref} disabled={loading}>
        <span>{children}</span>
        {loading ? (
          <span className="ml-4">
            <SVGLoadingIcon />
          </span>
        ) : null}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export default LoadingButton;
