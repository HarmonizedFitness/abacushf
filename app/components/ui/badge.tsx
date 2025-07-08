
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-orange text-white shadow hover:bg-gradient-orange-hover",
        secondary:
          "border-transparent bg-hf-card text-hf-text hover:bg-hf-card/80",
        destructive:
          "border-transparent bg-hf-error text-white shadow hover:bg-hf-error/80",
        outline: "text-foreground border-input",
        success:
          "border-transparent bg-hf-success text-white shadow hover:bg-hf-success/80",
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

export { Badge, badgeVariants }
