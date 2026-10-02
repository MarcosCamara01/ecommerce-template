import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-fg text-bg",
        secondary:
          "border-transparent bg-card text-fg",
        destructive:
          "border-transparent bg-err-bg text-err-fg",
        outline: "border-line text-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
