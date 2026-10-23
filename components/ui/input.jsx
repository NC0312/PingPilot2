import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    (<input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl bg-white/[0.035] px-3.5 py-2 text-base text-foreground shadow-[inset_0_1px_2px_oklch(0_0_0/0.25)] ring-1 ring-white/10 outline-none transition-[box-shadow,background-color] duration-300 ease-fluid placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:ring-white/20 focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/60 md:text-sm",
        className
      )}
      {...props} />)
  );
}

export { Input }
