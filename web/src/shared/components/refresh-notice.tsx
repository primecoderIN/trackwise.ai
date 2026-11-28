"use client"

// A shared component: the "couldn't refresh, so this may be out of date" line shown above data that's still on
// screen. Part of shared/. Used by the Dashboard, Expenses, Budgets, Categories, Reports, and Splits pages.

import { Button } from "@primecoderin/fast-ui-react"
import { RefreshCw, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"

interface RefreshNoticeProps {
  /** Why the reload failed (messageOf the error). */
  message: string
  /** Retry was pressed. */
  onRetry: () => void
  /** A retry is in flight: the button waits and its icon spins. */
  retrying?: boolean
}

/**
 * Data is on screen, but reloading it just failed: keep showing it, and say it may be out of date, with Retry.
 * (Replacing good data with an error card because one refresh failed would be worse.)
 */
export function RefreshNotice({ message, onRetry, retrying = false }: RefreshNoticeProps) {
  const t = useTranslations("common")
  return (
    <output className="flex flex-wrap items-center gap-2.5 rounded-lg border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-sm text-warning-foreground">
      <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <span className="min-w-0 flex-1">{t("refreshNotice.stale", { message })}</span>
      <Button variant="secondary" size="small" onClick={onRetry} isLoading={retrying} icon={<RefreshCw />}>
        {t("retry.retry")}
      </Button>
    </output>
  )
}
