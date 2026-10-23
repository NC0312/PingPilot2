import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-300 ease-fluid [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary/12 text-primary ring-1 ring-primary/25",
        secondary: "bg-white/[0.06] text-secondary-foreground ring-1 ring-white/8",
        success: "bg-success/12 text-success ring-1 ring-success/25",
        warning: "bg-warning/12 text-warning ring-1 ring-warning/25",
        destructive: "bg-destructive/12 text-destructive ring-1 ring-destructive/30",
        outline: "text-muted-foreground ring-1 ring-white/12",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    (<Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props} />)
  );
}

export { Badge, badgeVariants }
