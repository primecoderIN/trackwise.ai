"use client"

// React hook binding shared formatting helpers to the active `next-intl` locale so SSR and CSR render identically.

import { useLocale } from "next-intl"
import { useMemo } from "react"

import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from "@/shared/i18n/languages"

import * as fmt from "./format"

/** Memoized locale-bound date, count, rate, and money formatters tied to `next-intl` `useLocale()`. */
export function useFormatters() {
  const rawLocale = useLocale()
  const intlLocale = LANGUAGES[isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE].locale
  return useMemo(
    () => ({
      locale: intlLocale,
      formatCount: (value: number) => fmt.formatCount(value, intlLocale),
      formatAmount: (value: number | string) => fmt.formatAmount(value, intlLocale),
      formatRate: (value: string) => fmt.formatRate(value, intlLocale),
      formatMoney: (amount: number | string, currency: string) => fmt.formatMoney(amount, currency, intlLocale),
      formatCompactMoney: (amount: number, currency: string) => fmt.formatCompactMoney(amount, currency, intlLocale),
      formatDate: (value: string | Date) => fmt.formatDate(value, intlLocale),
      formatDateTime: (value: string) => fmt.formatDateTime(value, intlLocale),
      formatMonth: (isoMonth: string, style: "long" | "short" = "long") => fmt.formatMonth(isoMonth, style, intlLocale),
    }),
    [intlLocale],
  )
}
