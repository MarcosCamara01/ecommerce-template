import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-field border border-line bg-field px-[18px] text-[15px] text-fg transition-[border-color,box-shadow] duration-120 ease-out focus-visible:border-fg focus-visible:shadow-[0_0_0_4px_var(--ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-65 aria-[invalid=true]:border-err-line file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
