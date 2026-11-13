import { forwardRef } from "react";
import { ButtonProps, Button } from "@/components/ui/button";
import { Spinner } from "./loader";

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
        // Busy rather than disabled: a disabled button drops keyboard focus.
        // Swallowing the click also stops the implicit submit Enter fires.
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          props.onClick?.(event);
        }}
      >
        {loading ? <Spinner /> : icon || null}
        <span>{children}</span>
      </Button>
    );
  },
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
