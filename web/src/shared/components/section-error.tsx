"use client"

// A shared component: the error card that takes the place of a part that couldn't load or crashed. Part of shared/.
// Used by the pages (nothing loaded) and by app/ as the error boundaries' fallback (app-crashed.tsx, the layout).

import { Button, Card } from "@primecoderin/fast-ui-react"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

interface SectionErrorProps {
  /** What couldn't be shown ("Couldn't load the dashboard"). */
  title: string
  /** Why (messageOf the error). */
  message: string
  /** Try again was pressed. */
  onRetry: () => void
  /** A retry is in flight: the button says so and waits. */
  retrying?: boolean
}

/**
 * A part of a page that couldn't load (or crashed): say what happened and offer to try again, instead of showing
 * misleading zeros or a blank page. It's an alert, so screen readers announce it at once.
 */
export function SectionError({ title, message, onRetry, retrying = false }: SectionErrorProps) {
  const t = useTranslations("common")
  return (
    <Card role="alert" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        <p className="text-sm text-fg-secondary">{message}</p>
      </div>
      <div>
        <Button variant="secondary" size="small" onClick={onRetry} isLoading={retrying} icon={<RefreshCw />}>
          {retrying ? t("retry.tryingAgain") : t("retry.tryAgain")}
        </Button>
      </div>
    </Card>
  )
}
