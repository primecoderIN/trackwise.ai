// A shared component: the "nothing here yet" filler for a card or page, with an optional icon and action (either a link
// or a button click). Part of shared/, so it knows no feature (the caller passes the icon, text and action).

import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/shared/ui/button"

/** An action for an empty state: either a navigation link (`to`) or an in-page callback (`onClick`). */
export type EmptyStateAction = { label: string; to: string } | { label: string; onClick: () => void }

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
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground">
      {Icon && (
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        {title && <p className="font-medium text-foreground">{title}</p>}
        <p>{message}</p>
      </div>
      {action &&
        ("to" in action ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={action.to}>{action.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}
