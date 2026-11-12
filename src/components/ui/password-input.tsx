"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <InputGroup>
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
