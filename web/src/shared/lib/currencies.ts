// Supported currency helpers: type guard and localized currency names from Intl.DisplayNames. Part of shared/lib.
// Used by CurrencySelect (shared/components/), WelcomeDialog (app/_frame/) and PreferencesCard (features/account/).
// Never hardcodes currency names or lists: reads SUPPORTED_CURRENCIES from the backend's generated contract.

import { SUPPORTED_CURRENCIES } from "@/shared/api/contracts.gen"

/** One of the ISO 4217 currency codes the backend accepts for expenses and user preferences. */
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

const SUPPORTED_SET: ReadonlySet<string> = new Set<string>(SUPPORTED_CURRENCIES)

// Intl.DisplayNames instances, cached per locale so opening a dropdown doesn't rebuild formatters.
const currencyNames = new Map<string, Intl.DisplayNames | null>()

function displayNamesFor(locale: string): Intl.DisplayNames | null {
  if (currencyNames.has(locale)) return currencyNames.get(locale) ?? null
  try {
    const names = new Intl.DisplayNames([locale], { type: "currency" })
    currencyNames.set(locale, names)
    return names
  } catch {
    currencyNames.set(locale, null)
    return null
  }
}

/** Whether `value` is one of the backend's SUPPORTED_CURRENCIES codes. */
export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === "string" && SUPPORTED_SET.has(value)
}

/**
 * Formats an ISO 4217 code with its localized display name, e.g. "USD — US Dollar" (or just the code if Intl lacks
 * DisplayNames support for the locale).
 */
export function formatCurrencyLabel(code: string, locale: string): string {
  const name = displayNamesFor(locale)?.of(code)
  return name && name !== code ? `${code} — ${name}` : code
}
