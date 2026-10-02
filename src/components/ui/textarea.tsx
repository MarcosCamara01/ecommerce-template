import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-field border border-line bg-field px-[18px] py-3.5 text-[15px] text-fg transition-[border-color,box-shadow] duration-120 ease-out focus-visible:border-fg focus-visible:shadow-[0_0_0_4px_var(--ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-65 aria-[invalid=true]:border-err-line",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
