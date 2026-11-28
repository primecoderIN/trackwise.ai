"use client"

// Reusable searchable IANA timezone selector built on @primecoderin/fast-ui-react's Combobox and
// Intl.supportedValuesOf. Part of shared/components. Used by WelcomeDialog and PreferencesCard.

import { Combobox, type ComboboxOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { allTimezones, formatTimezoneOffset } from "@/shared/lib/timezones"

/** Props for the searchable IANA timezone picker. */
export interface TimezonePickerProps {
  id?: string
  value: string
  onChange: (timezone: string) => void
  disabled?: boolean
  ariaLabel?: string
}

/** Searchable combobox for choosing an IANA timezone name (e.g. "America/New_York", "UTC"). */
export function TimezonePicker({ id, value, onChange, disabled, ariaLabel }: TimezonePickerProps) {
  const t = useTranslations("common")

  const options = useMemo<ComboboxOption[]>(
    () =>
      allTimezones().map((zone) => {
        const offset = formatTimezoneOffset(zone)
        return { value: zone, label: offset ? `${zone} (${offset})` : zone }
      }),
    [],
  )

  return (
    <Combobox
      id={id}
      options={options}
      value={value}
      onValueChange={onChange}
      noMatchesLabel={t("timezone.empty")}
      placeholder={t("timezone.searchPlaceholder")}
      aria-label={ariaLabel ?? t("timezone.choose")}
      disabled={disabled}
      size="small"
    />
  )
}
