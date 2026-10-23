import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

/** Ping Pilott lockup. Mark sits in a small bezel tile; wordmark is set in the display face. */
function Brand({ href = "/", className, showWord = true, size = "md" }) {
  const dims = size === "lg" ? { tile: "size-11", img: 30, word: "text-xl" } : { tile: "size-9", img: 24, word: "text-[17px]" }
  return (
    <Link href={href} aria-label="Ping Pilott home" className={cn("group inline-flex items-center gap-2.5 rounded-full", className)}>
      <span className="bezel-sm">
        <span className={cn("bezel-sm-core grid place-items-center bg-white transition-transform duration-500 ease-fluid group-hover:scale-105", dims.tile)}>
          <Image src="/favicon.png" alt="" width={dims.img} height={dims.img} priority />
        </span>
      </span>
      {showWord && (
        <span className={cn("font-display font-medium tracking-tight text-foreground", dims.word)}>
          Ping Pilott
        </span>
      )}
    </Link>
  )
}

export { Brand }
