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
          "group flex h-[52px] w-full overflow-hidden rounded-field border border-line bg-field transition-[border-color,box-shadow] duration-120 ease-out focus-within:border-fg focus-within:shadow-[0_0_0_4px_var(--ring)] has-[[aria-invalid=true]]:border-err-line",
          containerClassName
        )}
      >
        <input
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"}
          placeholder={props.placeholder || "Password"}
          className={cn(
            "h-full w-full border-0 bg-transparent px-[18px] text-[15px] text-fg focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-65",
            className
          )}
          name={props.name || "password"}
        />
        <button
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="flex w-12 shrink-0 items-center justify-center rounded-pill text-muted transition-colors duration-120 hover:text-fg focus-visible:outline-offset-[-4px] disabled:cursor-not-allowed disabled:opacity-65"
          onClick={(e) => {
            e.preventDefault();
            setShowPassword(!showPassword);
          }}
          type="button"
          disabled={props.disabled}
        >
          {showPassword ? (
            <AiOutlineEye size={16} aria-hidden="true" />
          ) : (
            <AiOutlineEyeInvisible size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
