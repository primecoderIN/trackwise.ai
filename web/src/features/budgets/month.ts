// Month arithmetic on "YYYY-MM" strings, as pure functions: the Budgets page's previous and next month. Part of the
// budgets feature.

const MONTHS_PER_YEAR = 12
const MIN_YEAR = 1900
const MAX_YEAR = 2099
const MIN_INDEX = MIN_YEAR * MONTHS_PER_YEAR
const MAX_INDEX = MAX_YEAR * MONTHS_PER_YEAR + (MONTHS_PER_YEAR - 1)

/** The earliest and latest months SpendWise supports ("1900-01" to "2099-12"). */
export const MIN_MONTH = "1900-01"
export const MAX_MONTH = "2099-12"

/** The month `offset` months after `month` (before, if negative), clamped to 1900-01..2099-12. */
export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split("-").map(Number)
  const rawIndex = year * MONTHS_PER_YEAR + (number - 1) + offset
  const index = Math.min(Math.max(rawIndex, MIN_INDEX), MAX_INDEX)
  const shiftedYear = Math.floor(index / MONTHS_PER_YEAR)
  const shiftedMonth = (index % MONTHS_PER_YEAR) + 1
  return `${shiftedYear}-${String(shiftedMonth).padStart(2, "0")}`
}
