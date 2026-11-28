"use client"

// A shared component: the "nothing here yet" filler for a card or page, with an optional icon and action (either a link
// or a button click). Part of shared/, so it knows no feature (the caller passes the icon, text and action).

import { Button, EmptyState as FastEmptyState } from "@primecoderin/fast-ui-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { linkButtonClass } from "./link-button"

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
  const variant = action?.primary ? "primary" : "secondary"
  const actionNode = action ? (
    "to" in action ? (
      <Link href={action.to} className={linkButtonClass({ variant, size: "small" })}>
        {action.label}
      </Link>
    ) : (
      <Button variant={variant} size="small" onClick={action.onClick}>
        {action.label}
      </Button>
    )
  ) : undefined

  return (
    <FastEmptyState
      title={title ?? message}
      description={title ? message : undefined}
      icon={Icon ? <Icon className="size-5" aria-hidden="true" /> : undefined}
      tone="info"
      action={actionNode}
      className="min-h-44"
    />
  )
}
