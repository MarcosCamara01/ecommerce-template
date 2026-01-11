import { forwardRef } from "react";
import { ButtonProps, Button } from "@/components/ui/button";
import { SVGLoadingIcon } from "./loader";

type LoadingButtonProps = ButtonProps & {
  loading: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, icon, iconPosition = "left", ...props }, ref) => {
    const iconElement = loading ? (
      <span className="ml-4">
        <SVGLoadingIcon />
      </span>
    ) : icon ? (
      <span className={iconPosition === "left" ? "mr-2" : "ml-4"}>{icon}</span>
    ) : null;

    return (
      <Button {...props} ref={ref} disabled={loading}>
        {iconPosition === "left" && iconElement}
        <span>{children}</span>
        {iconPosition === "right" && iconElement}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export default LoadingButton;
