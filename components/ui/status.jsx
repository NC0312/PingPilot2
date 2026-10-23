import * as React from "react"

import { cn } from "@/lib/utils"

const STATUS = {
  up: { label: "Operational", dot: "bg-success", text: "text-success", tint: "bg-success/10 ring-success/25" },
  down: { label: "Down", dot: "bg-destructive", text: "text-destructive", tint: "bg-destructive/10 ring-destructive/30" },
  warning: { label: "Degraded", dot: "bg-warning", text: "text-warning", tint: "bg-warning/10 ring-warning/25" },
  paused: { label: "Paused", dot: "bg-muted-foreground", text: "text-muted-foreground", tint: "bg-white/[0.04] ring-white/10" },
  unknown: { label: "Pending", dot: "bg-muted-foreground", text: "text-muted-foreground", tint: "bg-white/[0.04] ring-white/10" },
}

function statusKey(status) {
  if (status === "up" || status === "down" || status === "warning" || status === "paused") return status
  return "unknown"
}

/** A live status dot. Healthy and failing states emit a slow ring; others stay still. */
function StatusDot({ status, className }) {
  const s = STATUS[statusKey(status)]
  const live = status === "up" || status === "down"
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)}>
      {live && (
        <span className={cn("absolute inset-0 animate-pulse-ring rounded-full", s.dot)} aria-hidden="true" />
      )}
      <span className={cn("relative size-2 rounded-full", s.dot)} />
    </span>
  )
}

/** Status as dot + label. Never colour alone: the label always carries the meaning. */
function StatusBadge({ status, label, className }) {
  const s = STATUS[statusKey(status)]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        s.tint,
        s.text,
        className
      )}>
      <StatusDot status={status} />
      {label ?? s.label}
    </span>
  )
}

export { StatusDot, StatusBadge, STATUS }
