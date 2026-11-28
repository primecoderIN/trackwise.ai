"use client"

// Reusable ISO currency dropdown built from the backend's SUPPORTED_CURRENCIES contract and localized via
// Intl.DisplayNames. Part of shared/components. Used by WelcomeDialog (app/_frame/) and PreferencesCard
// (features/account/).

import { SelectField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { SUPPORTED_CURRENCIES } from "@/shared/api/contracts.gen"
import { useLanguage } from "@/shared/i18n"
import { formatCurrencyLabel, isSupportedCurrency, type SupportedCurrency } from "@/shared/lib/currencies"

/** Props for the supported-currency selector. */
export interface CurrencySelectProps {
  id?: string
  value: string
  onChange: (currency: SupportedCurrency) => void
  disabled?: boolean
  ariaLabel?: string
}

/** Accessible dropdown listing every currency code supported by the backend with its localized name. */
export function CurrencySelect({ value, onChange, disabled, ariaLabel }: CurrencySelectProps) {
  const t = useTranslations("common")
  const { locale } = useLanguage()

  const options = useMemo<SelectOption[]>(
    () => SUPPORTED_CURRENCIES.map((code) => ({ value: code, label: formatCurrencyLabel(code, locale) })),
    [locale],
  )

  function handleChange(next: string) {
    if (isSupportedCurrency(next)) onChange(next)
  }

  return (
    <SelectField
      label={ariaLabel ?? t("currency.choose")}
      hideLabel
      options={options}
      value={value}
      onValueChange={handleChange}
      placeholder={t("currency.choose")}
      disabled={disabled}
      size="small"
    />
  )
}
