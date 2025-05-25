import React, { forwardRef } from "react";
import { ButtonProps, Button } from "@/components/ui/button";
import { SVGLoadingIcon } from "./loader";

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

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
