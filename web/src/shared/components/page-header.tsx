// A shared component: the top heading row of every signed-in page (title, one-line description, and optional main
// actions on the right). Part of shared/components, so every feature's page uses the same structure (Phase 28).

import type { ReactNode } from "react"

interface PageHeaderProps {
  /** The page's visible heading (h1). */
  title: string
  /** A one-line explanation beneath the heading. */
  description?: string
  /** The page's primary controls (e.g. an Add button or a month selector), aligned to the right. */
  actions?: ReactNode
}

/** The heading row at the top of a page: title and description on the left, main actions on the right. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
