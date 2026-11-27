// A shared component: the "nothing here yet" filler for a card or page, with an optional icon and action (either a link
// or a button click). Part of shared/, so it knows no feature (the caller passes the icon, text and action).

import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/shared/ui/button"

/** An action for an empty state: either a navigation link (`to`) or an in-page callback (`onClick`). */
export type EmptyStateAction =
  { label: string; to: string; primary?: boolean } | { label: string; onClick: () => void; primary?: boolean }

interface EmptyStateProps {
  /** An optional icon drawn above the title or message. */
  icon?: LucideIcon
  /** An optional short heading above the explanatory sentence. */
  title?: string
  /** What isn't there yet ("No expenses yet."). */
  message: string
  /** A way forward: a link or button chosen by whoever shows this (shared code doesn't know the pages). */
  action?: EmptyStateAction
}

/** What a card or page shows when there's nothing to show yet: an optional icon, a short message and a next step. */
export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  const variant = action?.primary ? "default" : "outline"
  return (
    <div className="flex h-full min-h-44 flex-col items-center justify-center gap-3.5 px-4 py-8 text-center text-sm text-muted-foreground">
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        {title && <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {action &&
        ("to" in action ? (
          <Button variant={variant} size="sm" asChild className="mt-1">
            <Link href={action.to}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant={variant} size="sm" onClick={action.onClick} className="mt-1">
            {action.label}
          </Button>
        ))}
    </div>
  )
}
