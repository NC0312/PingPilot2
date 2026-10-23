"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  ...props
}) {
  return (
    (<div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props} />
    </div>)
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    (<thead
      data-slot="table-header"
      className={cn("border-b border-white/[0.06]", className)}
      {...props} />)
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    (<tbody
      data-slot="table-body"
      className={cn("divide-y divide-white/[0.05]", className)}
      {...props} />)
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    (<tfoot
      data-slot="table-footer"
      className={cn("border-t border-white/[0.06] bg-white/[0.02] font-medium", className)}
      {...props} />)
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    (<tr
      data-slot="table-row"
      className={cn(
        "transition-colors duration-300 ease-fluid hover:bg-white/[0.025] data-[state=selected]:bg-white/[0.05]",
        className
      )}
      {...props} />)
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    (<th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-11 px-5 text-left align-middle text-[11px] font-medium uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground",
        className
      )}
      {...props} />)
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    (<td
      data-slot="table-cell"
      className={cn("px-5 py-4 align-middle", className)}
      {...props} />)
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    (<caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props} />)
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
