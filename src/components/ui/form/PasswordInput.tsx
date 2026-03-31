"use client";

/** FUNCTIONALITY */
import { forwardRef, useState, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
/** ICONS */
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div
        className={cn(
          "group flex w-full overflow-hidden rounded-md border border-border-primary bg-background-primary transition-colors focus-within:border-[#3b3b3b] focus-within:bg-background-secondary focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
          containerClassName
        )}
      >
        <input
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"}
          placeholder={props.placeholder || "Password"}
          className={cn(
            "h-11 w-full border-0 bg-transparent px-3.5 text-sm text-white placeholder:text-color-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          name={props.name || "password"}
        />
        <button
          className="flex w-11 shrink-0 items-center justify-center border-l border-border-primary bg-background-primary text-color-secondary transition-colors duration-150 hover:bg-background-tertiary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => {
            e.preventDefault();
            setShowPassword(!showPassword);
          }}
          type="button"
          disabled={props.disabled}
        >
          {showPassword ? (
            <AiOutlineEye size={16} />
          ) : (
            <AiOutlineEyeInvisible size={16} />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
