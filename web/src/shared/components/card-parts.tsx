// Layout parts for the design system's Card, which is a plain surface without header or footer slots. Part of
// shared/components. Pure markup on design tokens; the Card itself comes from @primecoderin/fast-ui-react.

import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/shared/lib/utils"

/** The block at the top of a Card: a title and a description, with an optional CardAction at the end edge. */
export function CardHeader({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1", className)} {...rest} />
  )
}

/** A Card's heading. */
export function CardTitle({ className, children, ...rest }: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3 className={cn("col-start-1 text-base leading-snug font-semibold text-fg", className)} {...rest}>
      {children}
    </h3>
  )
}

/** The quiet line under a Card's heading. */
export function CardDescription({ className, ...rest }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("col-start-1 text-sm text-fg-secondary", className)} {...rest} />
}

/** A control at the end edge of a CardHeader, level with the title. */
export function CardAction({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...rest} />
}

/** A Card's main content. */
export function CardContent({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn(className)} {...rest} />
}

/** The row at the bottom of a Card, for its actions. */
export function CardFooter({ className, ...rest }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mt-4 flex items-center gap-2", className)} {...rest} />
}
