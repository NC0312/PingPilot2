import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium select-none outline-none transition-[transform,background-color,box-shadow,color,opacity] duration-500 ease-fluid active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.1em] has-[[data-slot=button-arrow]]:pr-1.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.4),0_10px_28px_-10px_oklch(0.7_0.13_220/0.65)] hover:bg-[oklch(0.86_0.1_215)] hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.5),0_14px_34px_-10px_oklch(0.7_0.13_220/0.8)]",
        destructive:
          "bg-destructive/12 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/20",
        outline:
          "bg-white/[0.03] text-foreground ring-1 ring-white/12 hover:bg-white/[0.07] hover:ring-white/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost:
          "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
        link: "rounded-sm text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-[15px] has-[[data-slot=button-arrow]]:pr-2",
        icon: "size-10 px-0",
        "icon-sm": "size-8 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    (<Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />)
  );
}

/** Trailing icon island: nested in its own circle, flush with the button's right edge. */
function ButtonArrow({ className, children, ...props }) {
  return (
    <span
      data-slot="button-arrow"
      aria-hidden="true"
      className={cn(
        "grid size-7 place-items-center rounded-full bg-black/10 transition-transform duration-500 ease-fluid group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105",
        className
      )}
      {...props}>
      {children ?? <ArrowUpRight weight="light" className="size-4" />}
    </span>
  );
}

export { Button, ButtonArrow, buttonVariants }
