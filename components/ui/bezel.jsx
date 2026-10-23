import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Double-bezel container: outer tray + inner core with concentric radii.
 * size="lg" for marketing surfaces, "sm" for dense app surfaces.
 */
function Bezel({ size = "lg", className, coreClassName, children, ...props }) {
  const small = size === "sm"
  return (
    <div className={cn(small ? "bezel-sm" : "bezel", className)} {...props}>
      <div className={cn(small ? "bezel-sm-core" : "bezel-core", "h-full", coreClassName)}>
        {children}
      </div>
    </div>
  )
}

export { Bezel }
