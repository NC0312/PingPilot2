import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Label + control + hint/error. Pass the control as children and give it
 * the same `id`. Errors are announced and linked via aria-describedby on the control
 * (set `aria-describedby={`${id}-msg`}` and `aria-invalid` on the input).
 */
function Field({ id, label, optional, hint, error, className, children }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-foreground/90">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p
          id={`${id}-msg`}
          role={error ? "alert" : undefined}
          className={cn("text-[13px]", error ? "text-destructive" : "text-muted-foreground")}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export { Field }
