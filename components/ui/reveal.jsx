"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Scroll-entry reveal. One IntersectionObserver per element, fires once.
 * `delay` (ms) staggers siblings. Falls back to visible when IO is unavailable.
 */
function Reveal({ as: Tag = "div", delay = 0, className, style, children, ...props }) {
  const ref = React.useRef(null)
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={cn("reveal", shown && "reveal-in", className)}
      style={{ "--reveal-delay": `${delay}ms`, ...style }}
      {...props}>
      {children}
    </Tag>
  )
}

export { Reveal }
