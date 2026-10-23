import * as React from "react"

import { cn } from "@/lib/utils"

/** Page title block for every app screen: orientation first, actions on the right. */
function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-3">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  )
}

export { PageHeader }
