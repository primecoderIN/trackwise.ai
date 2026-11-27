// Pure helpers for parsing and serialising Expenses page filters in URL search parameters, plus quick date-range
// presets. Part of the expenses feature; used by expenses-page.tsx and filters-bar.tsx.

import { currentMonth, isoDate, monthDateRange, parseIsoDate, shiftMonth, todayIso } from "@/shared/lib/format"

import type { ExpenseFilters } from "./api"

/** Date range preset keys offered in the Expenses filter bar. */
export type DatePreset = "thisMonth" | "lastMonth" | "last30Days"

/** Reads validated filter parameters from URL search params (enabling drill-down links from Categories & Dashboard). */
export function filtersFromSearchParams(params: URLSearchParams): ExpenseFilters {
  const filters: ExpenseFilters = {}
  const search = params.get("search")?.trim()
  if (search) filters.search = search

  const rawCategory = params.get("category_id")
  if (rawCategory) {
    const parsed = Number(rawCategory)
    if (Number.isInteger(parsed) && parsed > 0) filters.category_id = parsed
  }

  const start = params.get("start_date")
  if (start && parseIsoDate(start)) filters.start_date = start

  const end = params.get("end_date")
  if (end && parseIsoDate(end)) filters.end_date = end

  if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
    delete filters.end_date
  }
  return filters
}

/** Builds a clean query string representing active filters (omitting empty values and one-shot params like `add=1`). */
export function filtersToQueryString(filters: ExpenseFilters): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.category_id) params.set("category_id", String(filters.category_id))
  if (filters.start_date) params.set("start_date", filters.start_date)
  if (filters.end_date) params.set("end_date", filters.end_date)
  return params.toString()
}

/** Computes `{ start, end }` ISO date strings for a quick date preset relative to today. */
export function datePresetRange(preset: DatePreset): { start: string; end: string } {
  if (preset === "thisMonth") {
    return monthDateRange(currentMonth()) ?? { start: todayIso(), end: todayIso() }
  }
  if (preset === "lastMonth") {
    return monthDateRange(shiftMonth(currentMonth(), -1)) ?? { start: todayIso(), end: todayIso() }
  }
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29)
  return { start: isoDate(start), end: isoDate(end) }
}
