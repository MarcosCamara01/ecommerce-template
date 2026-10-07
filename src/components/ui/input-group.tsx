"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

const inputGroupVariants = cva(
  "group/input-group relative flex w-full min-w-0 items-center text-fg",
  {
    variants: {
      variant: {
        default:
          "h-[52px] overflow-hidden rounded-field border border-line bg-field transition-[border-color,box-shadow] duration-120 ease-out focus-within:border-fg focus-within:shadow-[0_0_0_4px_var(--ring)] has-[[aria-invalid=true]]:border-err-line",
        search:
          "min-h-[68px] gap-3 border-b border-line bg-transparent pl-5 pr-3",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function InputGroup({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      data-variant={variant}
      role="group"
      className={cn(inputGroupVariants({ variant }), className)}
      {...props}
    />
  );
}

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & { align?: "inline-start" | "inline-end" }) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex h-full shrink-0 items-center justify-center gap-3",
        align === "inline-start" ? "order-first" : "order-last",
        className,
      )}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="input-group-button"
      type={type}
      variant={variant}
      size={size}
      className={cn("h-full text-muted hover:text-fg focus-visible:outline-offset-[-4px]", className)}
      {...props}
    />
  );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:shadow-none group-data-[variant=search]/input-group:h-[52px] group-data-[variant=search]/input-group:px-0 group-data-[variant=search]/input-group:text-xl [&::-webkit-search-cancel-button]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput };
