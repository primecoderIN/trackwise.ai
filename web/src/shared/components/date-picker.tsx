"use client"

// Reusable calendar popover date picker storing ISO "YYYY-MM-DD" strings, matching the active next-intl locale and
// dark/light theme across every browser. Part of shared/components; used by Expenses forms and filters.

import { CalendarIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { useLanguage } from "@/shared/i18n"
import { isoDate, parseIsoDate, todayIso } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

/** Props for the locale-aware calendar date picker. */
export interface DatePickerProps {
  id?: string
  /** Current ISO date ("YYYY-MM-DD") or empty string. */
  value: string
  /** Called with an ISO date string, or "" when cleared. */
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  minDate?: string
  maxDate?: string
  clearable?: boolean
  disabled?: boolean
  className?: string
}

/** Accessible single-date selector backed by react-day-picker with Today and optional Clear footer actions. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  minDate,
  maxDate,
  clearable = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations("common")
  const { datePickerLocale } = useLanguage()
  const { formatDate } = useFormatters()

  const selected = parseIsoDate(value)
  const min = parseIsoDate(minDate)
  const max = parseIsoDate(maxDate)

  function handleSelect(day: Date | undefined) {
    if (!day) return
    onChange(isoDate(day))
    setOpen(false)
  }

  function isDateDisabled(day: Date): boolean {
    if (min && day < min) return true
    if (max && day > max) return true
    return false
  }

  const today = parseIsoDate(todayIso())
  const canPickToday = today !== undefined && !isDateDisabled(today)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn("w-full justify-start gap-2 px-3 font-normal", !selected && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">
            {selected ? formatDate(selected) : (placeholder ?? t("datePicker.placeholder"))}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={datePickerLocale}
          selected={selected}
          defaultMonth={selected}
          disabled={min || max ? isDateDisabled : undefined}
          onSelect={handleSelect}
        />
        {(canPickToday || (clearable && Boolean(value))) && (
          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            {canPickToday ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  onChange(todayIso())
                  setOpen(false)
                }}
              >
                {t("datePicker.today")}
              </Button>
            ) : (
              <span />
            )}
            {clearable && value && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                {t("datePicker.clear")}
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
