// Reusable ISO currency dropdown built from the backend's SUPPORTED_CURRENCIES contract and localized via
// Intl.DisplayNames. Part of shared/components. Used by WelcomeDialog (app/_frame/) and PreferencesCard
// (features/account/).

import { useTranslation } from "react-i18next"

import { SUPPORTED_CURRENCIES } from "@/shared/api/contracts.gen"
import { useLanguage } from "@/shared/i18n"
import { formatCurrencyLabel, isSupportedCurrency, type SupportedCurrency } from "@/shared/lib/currencies"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

/** Props for the supported-currency selector. */
export interface CurrencySelectProps {
  id?: string
  value: string
  onChange: (currency: SupportedCurrency) => void
  disabled?: boolean
  ariaLabel?: string
}

/** Accessible dropdown listing every currency code supported by the backend with its localized name. */
export function CurrencySelect({ id, value, onChange, disabled, ariaLabel }: CurrencySelectProps) {
  const { t } = useTranslation()
  const { locale } = useLanguage()

  function handleChange(next: string) {
    if (isSupportedCurrency(next)) onChange(next)
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full" aria-label={ariaLabel ?? t("currency.choose")}>
        <SelectValue placeholder={t("currency.choose")} />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            {formatCurrencyLabel(code, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
