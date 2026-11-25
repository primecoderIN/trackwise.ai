"use client"

// A shared component: an expense's amount in its own currency and, when that isn't BASE_CURRENCY, the base-currency
// amount it's stored with too (D204), the one totals count. Part of shared/. Used by the Expenses table and the
// Dashboard's recent expenses.

import { useTranslations } from "next-intl"

import { BASE_CURRENCY } from "@/shared/api/contracts.gen"
import { useFormatters } from "@/shared/lib/use-formatters"

interface ExpenseMoneyProps {
  /** The amount in its own currency (a decimal string from the API). */
  amount: string
  currency: string
  /** The same amount in BASE_CURRENCY; null for an expense in another currency that hasn't been converted. */
  baseAmount: string | null
  /** The rate it was converted at, and that rate's day (ISO date). */
  rate: string | null
  rateDate: string | null
}

/**
 * Shows the expense's amount in its own currency, with "≈ <base amount>" under it for another currency;
 * its title says the rate and the day. An amount already in BASE_CURRENCY, or one not converted yet, is shown alone.
 */
export function ExpenseMoney({ amount, currency, baseAmount, rate, rateDate }: ExpenseMoneyProps) {
  const t = useTranslations("common")
  const { formatDate, formatMoney, formatRate } = useFormatters()
  const own = formatMoney(amount, currency)
  if (currency === BASE_CURRENCY || baseAmount === null || rate === null || rateDate === null) {
    return <span>{own}</span>
  }
  const inBase = formatMoney(baseAmount, BASE_CURRENCY)
  const label = t("money.inBaseLabel", {
    amount: inBase,
    currency: BASE_CURRENCY,
    rate: formatRate(rate),
    date: formatDate(rateDate),
  })
  return (
    <span className="inline-flex flex-col items-end leading-tight" title={label} aria-label={`${own} (${label})`}>
      <span>{own}</span>
      <span className="text-xs text-muted-foreground">{t("money.inBase", { amount: inBase })}</span>
    </span>
  )
}
