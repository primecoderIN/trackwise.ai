// Shared display helpers: money, dates and months, formatted via Intl for a given BCP 47 locale tag.
// Part of shared/lib. React components use `useFormatters()` so formatting stays synchronized with `next-intl`'s locale.

// Whole-number formatters, one per locale, made on first use.
const countFormats = new Map<string, Intl.NumberFormat>()

/** 1250 -> "1,250" (in the given locale's digit grouping). */
export function formatCount(value: number, current: string): string {
  let format = countFormats.get(current)
  if (!format) {
    format = new Intl.NumberFormat(current, { maximumFractionDigits: 0 })
    countFormats.set(current, format)
  }
  return format.format(value)
}

// Always two decimals, with the locale's digit grouping. One formatter per locale, made on first use: building a
// formatter is the slow part.
const amountFormats = new Map<string, Intl.NumberFormat>()

/** 125000.5 -> "125,000.50" (in English). Number() is fine for *display*: exact values stay in minor units. */
export function formatAmount(value: number | string, current: string): string {
  let format = amountFormats.get(current)
  if (!format) {
    format = new Intl.NumberFormat(current, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    amountFormats.set(current, format)
  }
  return format.format(Number(value))
}

// Rate formatters, one per locale, made on first use.
const rateFormats = new Map<string, Intl.NumberFormat>()
// A rate keeps up to this many decimals (a cross rate such as 0.0118343195), and no trailing zeros.
const MAX_RATE_DECIMALS = 10

/** "84.5" -> "84.5", "0.0118343195" -> "0.0118343195": an exchange rate, with only the decimals it has. */
export function formatRate(value: string, current: string): string {
  let format = rateFormats.get(current)
  if (!format) {
    format = new Intl.NumberFormat(current, { maximumFractionDigits: MAX_RATE_DECIMALS })
    rateFormats.set(current, format)
  }
  return format.format(Number(value))
}

// Currency formatters, one per locale and currency, made on first use.
const moneyFormats = new Map<string, Intl.NumberFormat>()

/**
 * "125000.5", "USD" -> "$125,000.50"; "EUR" -> "€1,250.50": the currency's CLDR format in the given locale.
 * The backend's format_money writes amounts from the same CLDR data, so the chat's cards and the pages agree.
 */
export function formatMoney(amount: number | string, currency: string, current: string): string {
  const cacheKey = `${current}|${currency}`
  let format = moneyFormats.get(cacheKey)
  if (!format) {
    try {
      format = new Intl.NumberFormat(current, { style: "currency", currency })
      moneyFormats.set(cacheKey, format)
    } catch {
      return `${currency} ${formatAmount(amount, current)}`
    }
  }
  return format.format(Number(amount))
}

// Compact currency formatters, one per locale and currency, made on first use (an axis formats every tick).
const compactFormats = new Map<string, Intl.NumberFormat>()

/** A short money label for chart axes: 125000 -> "$125K" style. */
export function formatCompactMoney(amount: number, currency: string, current: string): string {
  const cacheKey = `${current}|${currency}`
  let format = compactFormats.get(cacheKey)
  if (!format) {
    try {
      format = new Intl.NumberFormat(current, { style: "currency", currency, notation: "compact" })
      compactFormats.set(cacheKey, format)
    } catch {
      return `${currency} ${formatAmount(amount, current)}`
    }
  }
  return format.format(amount)
}

/**
 * "2026-11-13" (or a longer ISO text starting so) -> a Date at local midnight; anything else -> undefined.
 * new Date("2026-11-13") would mean midnight UTC, which is still the previous day in some time zones, so dates
 * are built from their parts instead.
 */
export function parseIsoDate(value: unknown): Date | undefined {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return undefined
  }
  return parsed
}

/** A Date -> "2026-11-13", by its local calendar day (the reverse of parseIsoDate). */
export function isoDate(day: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

/** "2026-11-13" (or a Date) -> "13 Nov 2026"; text that isn't a date -> "". */
export function formatDate(value: string | Date, current: string): string {
  const day = value instanceof Date ? value : parseIsoDate(value)
  return day ? day.toLocaleDateString(current, { day: "numeric", month: "short", year: "numeric" }) : ""
}

/**
 * A moment with its time zone ("2026-11-15T10:30:00Z", as the API sends timestamps) -> "15 Nov 2026, 4:00 pm", in this
 * device's time zone; text that isn't a moment -> "".
 */
export function formatDateTime(value: string, current: string): string {
  const moment = new Date(value)
  if (Number.isNaN(moment.getTime())) return ""
  return moment.toLocaleString(current, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/** "2026-11" -> "November 2026" (long) or "Nov" (short, for chart axes); invalid text -> "". */
export function formatMonth(isoMonth: string, style: "long" | "short", current: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(isoMonth)) return ""
  const [year, month] = isoMonth.split("-").map(Number)
  const options: Intl.DateTimeFormatOptions = style === "long" ? { month: "long", year: "numeric" } : { month: "short" }
  return new Date(year, month - 1, 1).toLocaleDateString(current, options)
}

/** Today, on this device's calendar, as "YYYY-MM-DD" (a new expense's default date). */
export function todayIso(): string {
  return isoDate(new Date())
}

/** This month as "YYYY-MM" (the Dashboard's summary month). */
export function currentMonth(): string {
  return todayIso().slice(0, 7)
}

const MONTHS_PER_YEAR = 12
const MIN_YEAR = 1900
const MAX_YEAR = 2099
const MIN_MONTH_INDEX = MIN_YEAR * MONTHS_PER_YEAR
const MAX_MONTH_INDEX = MAX_YEAR * MONTHS_PER_YEAR + (MONTHS_PER_YEAR - 1)

/** The earliest and latest months SpendWise supports ("1900-01" to "2099-12"). */
export const MIN_MONTH = "1900-01"
export const MAX_MONTH = "2099-12"

/** The month `offset` months after `month` (before, if negative), clamped to 1900-01..2099-12. */
export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split("-").map(Number)
  const rawIndex = year * MONTHS_PER_YEAR + (number - 1) + offset
  const index = Math.min(Math.max(rawIndex, MIN_MONTH_INDEX), MAX_MONTH_INDEX)
  const shiftedYear = Math.floor(index / MONTHS_PER_YEAR)
  const shiftedMonth = (index % MONTHS_PER_YEAR) + 1
  return `${shiftedYear}-${String(shiftedMonth).padStart(2, "0")}`
}
