import * as React from "react"

import { cn } from "@/lib/utils"

/** Composed empty view: one icon, one sentence of why, one next action. */
function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      {Icon && (
        <div className="bezel-sm mb-6">
          <div className="bezel-sm-core grid size-14 place-items-center text-primary">
            <Icon weight="light" className="size-7" />
          </div>
        </div>
      )}
      <h3 className="font-display text-xl font-medium tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export { EmptyState }
