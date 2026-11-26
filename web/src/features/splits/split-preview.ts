// Pure exponent-aware minor-unit conversion and Equal/Exact split preview math (D225).
// Mirrors backend/app/modules/splits/domain/math.py so the SplitDialog preview matches server allocation to the cent.

import { CURRENCY_EXPONENTS } from "@/shared/api/contracts.gen"

const DEFAULT_EXPONENT = 2

/** Minor-unit decimal places for `currency` (e.g. 2 for USD/INR, 0 for JPY, 3 for KWD). */
export function currencyExponent(currency: string): number {
  const map: Readonly<Record<string, number>> = CURRENCY_EXPONENTS
  return map[currency] ?? DEFAULT_EXPONENT
}

/** Parses a decimal string into whole minor units for `currency`, returning null if malformed or exceeding precision. */
export function parseMajorToMinor(raw: string, currency: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null
  const exp = currencyExponent(currency)
  const [whole, frac = ""] = trimmed.split(".")
  if (frac.length > exp) return null
  const padded = frac.padEnd(exp, "0")
  const combined = Number(`${whole}${padded}`)
  return Number.isSafeInteger(combined) ? combined : null
}

/** Formats whole minor units into a fixed-precision decimal string for `currency` (e.g. 1250 -> "12.50"). */
export function formatMinorToMajor(minor: number, currency: string): string {
  const exp = currencyExponent(currency)
  const sign = minor < 0 ? "-" : ""
  const abs = Math.abs(Math.trunc(minor))
  if (exp === 0) return `${sign}${abs}`
  const factor = 10 ** exp
  const whole = Math.floor(abs / factor)
  const frac = String(abs % factor).padStart(exp, "0")
  return `${sign}${whole}.${frac}`
}

/** Splits `totalMinor` equally across `keys` using deterministic +1 remainder distribution matching the backend. */
export function previewEqualShares(totalMinor: number, keys: readonly string[]): Record<string, number> {
  if (totalMinor <= 0 || keys.length === 0) return {}
  const base = Math.floor(totalMinor / keys.length)
  const remainder = totalMinor % keys.length
  const result: Record<string, number> = {}
  keys.forEach((key, index) => {
    result[key] = base + (index < remainder ? 1 : 0)
  })
  return result
}
