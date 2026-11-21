// The insights catalog's data rules, as pure functions: which chart points are drawn, how long a unit may
// be, and how a value is written. Part of the assistant feature's A2UI renderer; used by the Chart
// renderer in a2ui-insights.tsx. A chart's data comes from the server, so nothing here trusts its shape.

import { A2UI } from "@/shared/api/contracts.gen"
import { currentLanguageInfo } from "@/shared/i18n"
import { formatAmount } from "@/shared/lib/format"
import { isObject } from "@/shared/lib/guards"

const { maxChartPoints, maxUnitLength } = A2UI.insights

/** One point of a chart: its label (only ever drawn as text) and its value. */
export interface ChartPoint {
  label: string
  value: number
}

function isPoint(value: unknown): value is ChartPoint {
  return (
    isObject(value) &&
    typeof value.label === "string" &&
    typeof value.value === "number" &&
    Number.isFinite(value.value)
  )
}

/**
 * A chart's points: only well-formed ones, at most the contract's `maxChartPoints`, each a copy of just
 * the two fields a chart uses. Anything that isn't a list gives no points.
 */
export function readPoints(data: unknown): ChartPoint[] {
  if (!Array.isArray(data)) return []
  return data
    .filter(isPoint)
    .slice(0, maxChartPoints)
    .map((p) => ({ label: p.label, value: p.value }))
}

/** A chart's unit (like "₹"), cut to the contract's `maxUnitLength`; "" when it has none or it isn't text. */
export function readUnit(unit: unknown): string {
  return typeof unit === "string" ? unit.slice(0, maxUnitLength) : ""
}

const LETTER_START = /^\p{L}/u

// True when a unit is a prefix currency/symbol (like "₹" or "$"), not "%" and not starting with a letter.
function isPrefixSymbol(unit: string): boolean {
  return unit !== "" && unit !== "%" && !LETTER_START.test(unit)
}

/**
 * A donut chart's slices: only positive finite values, so negative, zero or NaN values never corrupt the
 * donut total or percentage calculation.
 */
export function positivePoints(points: readonly ChartPoint[]): ChartPoint[] {
  return points.filter((point) => point.value > 0 && Number.isFinite(point.value))
}

/**
 * A value as a chart writes it. With a unit (money): grouped with two decimals, exactly like the amounts
 * the server writes in the same card ("₹2,340.00"), so a number never appears in two styles side by side.
 * Negative values with a prefix symbol place the minus sign before the symbol ("-₹250.00").
 * Without one: up to two decimals. Both in the locale of the language on now.
 */
export function formatValue(value: unknown, unit: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return ""
  if (unit) {
    if (numeric < 0 && isPrefixSymbol(unit)) {
      return `-${unit}${formatAmount(Math.abs(numeric))}`
    }
    return `${unit}${formatAmount(numeric)}`
  }
  return numeric.toLocaleString(currentLanguageInfo().locale, { maximumFractionDigits: 2 })
}
