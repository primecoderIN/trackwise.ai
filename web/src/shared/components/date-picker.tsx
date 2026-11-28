"use client"

// Reusable calendar popover date picker storing ISO "YYYY-MM-DD" strings, matching the active next-intl locale and
// dark/light theme across every browser. Part of shared/components; used by Expenses forms and filters.

import { DateTimePicker, type DateTimePickerLabels } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { useLanguage } from "@/shared/i18n"

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

/** Accessible single-date selector backed by @primecoderin/fast-ui-react's DateTimePicker. */
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
  const t = useTranslations("common")
  const { datePickerLocale } = useLanguage()

  const labels = useMemo<DateTimePickerLabels>(
    () => ({
      select: placeholder ?? t("datePicker.placeholder"),
      today: t("datePicker.today"),
      now: t("datePicker.now"),
      clear: t("datePicker.clear"),
      done: t("datePicker.done"),
      time: t("datePicker.time"),
      hour: t("datePicker.hour"),
      minute: t("datePicker.minute"),
      second: t("datePicker.second"),
      previousMonth: t("datePicker.previousMonth"),
      nextMonth: t("datePicker.nextMonth"),
      previousYear: t("datePicker.previousYear"),
      nextYear: t("datePicker.nextYear"),
      chooseMonth: t("datePicker.chooseMonth"),
      backToCalendar: t("datePicker.backToCalendar"),
      chooseDate: t("datePicker.chooseDate"),
      chooseDateTime: t("datePicker.chooseDateTime"),
      chooseTime: t("datePicker.chooseTime"),
    }),
    [placeholder, t],
  )

  return (
    <div className={className}>
      <DateTimePicker
        id={id}
        mode="date"
        value={value}
        onValueChange={onChange}
        min={minDate}
        max={maxDate}
        clearable={clearable}
        showNow
        disabled={disabled}
        placeholder={placeholder ?? t("datePicker.placeholder")}
        aria-label={ariaLabel}
        locale={datePickerLocale}
        labels={labels}
        size="small"
      />
    </div>
  )
}
