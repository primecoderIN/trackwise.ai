"use client"

// Reusable month stepper pill with Previous / Next controls and a quick "This month" jump button when viewing
// another month. Part of shared/components; used by Dashboard, Budgets, Categories, and Reports.

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { currentMonth, MAX_MONTH, MIN_MONTH, shiftMonth } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Button } from "@/shared/ui/button"

/** Props for the shared month stepper control. */
export interface MonthPickerProps {
  /** Active month in "YYYY-MM" format. */
  month: string
  /** Called with the newly chosen "YYYY-MM" month. */
  onChange: (nextMonth: string) => void
  /** Latest month selectable (defaults to MAX_MONTH). */
  maxMonth?: string
}

/** Segmented month navigator with keyboard-accessible previous/next arrows and a reset-to-current shortcut. */
export function MonthPicker({ month, onChange, maxMonth = MAX_MONTH }: MonthPickerProps) {
  const t = useTranslations("common")
  const { formatMonth } = useFormatters()
  const nowMonth = currentMonth()
  const isCurrent = month === nowMonth

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!isCurrent && (
        <Button variant="outline" size="sm" onClick={() => onChange(nowMonth)} className="h-9 text-xs">
          {t("monthPicker.current")}
        </Button>
      )}
      <div className="inline-flex items-center rounded-lg border border-border/80 bg-card p-0.5 shadow-2xs">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("monthPicker.previous")}
          onClick={() => onChange(shiftMonth(month, -1))}
          disabled={month <= MIN_MONTH}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span
          aria-live="polite"
          className="inline-flex min-w-28 items-center justify-center gap-1.5 px-1.5 text-xs font-medium tabular-nums sm:min-w-36 sm:px-2 sm:text-sm"
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{formatMonth(month)}</span>
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("monthPicker.next")}
          onClick={() => onChange(shiftMonth(month, 1))}
          disabled={month >= maxMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
