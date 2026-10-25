"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

const EASE = [0.32, 0.72, 0, 1]

/**
 * Accessible modal. Escape and backdrop click close it, body scroll is locked,
 * focus moves into the panel and returns to the trigger on close.
 *
 * It is drawn straight into <body>: a parent with a transform (the page's reveal animation) makes `fixed` mean "inside that
 * parent", which cut the dialog off and let the content after it paint over it. A tall dialog scrolls inside itself.
 */
function Dialog({ open, onClose, title, description, children, footer, className }) {
  const panelRef = React.useRef(null)
  const returnRef = React.useRef(null)
  const titleId = React.useId()
  const onCloseRef = React.useRef(onClose)
  onCloseRef.current = onClose
  const [host, setHost] = React.useState(null)
  React.useEffect(() => setHost(document.body), [])

  React.useEffect(() => {
    if (!open) return
    returnRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()

    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current?.()
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      returnRef.current?.focus?.()
    }
  }, [open])

  if (!host) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          style={{ zIndex: "var(--z-modal)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose?.()
          }}>
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn("bezel-sm max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto outline-none", className)}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE }}>
            <div className="bezel-sm-core p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 id={titleId} className="font-display text-xl font-medium tracking-tight">
                    {title}
                  </h2>
                  {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-white/[0.06] hover:text-foreground">
                  <X weight="light" className="size-5" />
                </button>
              </div>
              {children && <div className="mt-5">{children}</div>}
              {footer && <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">{footer}</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    host
  )
}

export { Dialog }
