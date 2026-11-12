import { forwardRef } from "react";
import { ButtonProps, Button } from "@/components/ui/button";
import { SVGLoadingIcon } from "./loader";

type LoadingButtonProps = ButtonProps & {
  loading: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, icon, ...props }, ref) => {
    return (
      <Button
        {...props}
        ref={ref}
        aria-busy={loading || undefined}
        disabled={Boolean(props.disabled || loading)}
      >
        {loading ? <SVGLoadingIcon /> : icon || null}
        <span>{children}</span>
      </Button>
    );
  },
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
