"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <InputGroup className={containerClassName}>
        <InputGroupInput
          {...props}
          ref={ref}
          type={showPassword ? "text" : "password"}
          placeholder={props.placeholder || "Password"}
          className={className}
          name={props.name || "password"}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((previous) => !previous)}
            type="button"
            disabled={props.disabled}
          >
            {showPassword ? (
              <AiOutlineEye size={16} aria-hidden="true" />
            ) : (
              <AiOutlineEyeInvisible size={16} aria-hidden="true" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
