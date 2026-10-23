import * as React from "react"
import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@/lib/utils"

const TONES = {
  info: { icon: Info, box: "bg-primary/8 ring-primary/20", icon_: "text-primary" },
  success: { icon: CheckCircle, box: "bg-success/8 ring-success/20", icon_: "text-success" },
  warning: { icon: Warning, box: "bg-warning/8 ring-warning/20", icon_: "text-warning" },
  error: { icon: WarningCircle, box: "bg-destructive/8 ring-destructive/25", icon_: "text-destructive" },
}

/** Inline message. Say what happened and what to do next. */
function Alert({ tone = "info", title, children, action, className, ...props }) {
  const t = TONES[tone] ?? TONES.info
  const Icon = t.icon
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm ring-1", t.box, className)}
      {...props}>
      <Icon weight="light" className={cn("mt-0.5 size-5 shrink-0", t.icon_)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children && <div className={cn("text-muted-foreground", title && "mt-0.5")}>{children}</div>}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  )
}

export { Alert }
