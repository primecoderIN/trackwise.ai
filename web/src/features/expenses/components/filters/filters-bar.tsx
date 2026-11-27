// A component of the expenses feature: the upgraded filter bar card above the table (search with inline clear,
// category dropdown with icons, calendar date pickers, quick date presets, and Clear filters). Used by ExpensesPage.

import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { ANY_CATEGORY, CategorySelect } from "@/features/categories"
import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

import type { ExpenseFilters } from "../../api"
import { datePresetRange, type DatePreset } from "../../filter-params"

const PRESETS: readonly { key: DatePreset; labelKey: "presetThisMonth" | "presetLastMonth" | "presetLast30Days" }[] = [
  { key: "thisMonth", labelKey: "presetThisMonth" },
  { key: "lastMonth", labelKey: "presetLastMonth" },
  { key: "last30Days", labelKey: "presetLast30Days" },
]

interface FiltersBarProps {
  /** The filters as they are now (the page's state). */
  filters: ExpenseFilters
  /** Called with the whole new set of filters after any change. */
  onChange: (filters: ExpenseFilters) => void
}

/**
 * Cohesive filter card: search box with inline clear, category selector, calendar popover From/To pickers, and
 * one-click date presets. Emptied values are removed (`undefined`), never sent as "".
 */
export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const t = useTranslations("expenses")
  const set = (changes: Partial<ExpenseFilters>) => onChange({ ...filters, ...changes })
  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== "")

  function applyPreset(preset: DatePreset) {
    const { start, end } = datePresetRange(preset)
    const active = filters.start_date === start && filters.end_date === end
    set(active ? { start_date: undefined, end_date: undefined } : { start_date: start, end_date: end })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(13rem,1.4fr)_minmax(10rem,1fr)_minmax(9.5rem,1fr)_minmax(9.5rem,1fr)]">
        <LabeledField id="filter-search" label={t("filters.search")}>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="filter-search"
              maxLength={100}
              placeholder={t("filters.searchPlaceholder")}
              className="pr-8 pl-9"
              value={filters.search ?? ""}
              onChange={(event) => set({ search: event.target.value || undefined })}
            />
            {filters.search && (
              <button
                type="button"
                aria-label={t("filters.clearSearch")}
                onClick={() => set({ search: undefined })}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </LabeledField>

        <LabeledField id="filter-category" label={t("fields.category")}>
          <CategorySelect
            id="filter-category"
            className="w-full"
            anyLabel={t("filters.allCategories")}
            value={filters.category_id ? String(filters.category_id) : ANY_CATEGORY}
            onChange={(value) => set({ category_id: value === ANY_CATEGORY ? undefined : Number(value) })}
          />
        </LabeledField>

        <LabeledField id="filter-from" label={t("filters.from")}>
          <DatePicker
            id="filter-from"
            value={filters.start_date ?? ""}
            maxDate={filters.end_date ?? undefined}
            clearable
            ariaLabel={t("filters.from")}
            onChange={(next) => {
              const nextStart = next || undefined
              const end = filters.end_date && nextStart && nextStart > filters.end_date ? undefined : filters.end_date
              set({ start_date: nextStart, end_date: end })
            }}
          />
        </LabeledField>

        <LabeledField id="filter-to" label={t("filters.to")}>
          <DatePicker
            id="filter-to"
            value={filters.end_date ?? ""}
            minDate={filters.start_date ?? undefined}
            clearable
            ariaLabel={t("filters.to")}
            onChange={(next) => {
              const nextEnd = next || undefined
              const start =
                filters.start_date && nextEnd && nextEnd < filters.start_date ? undefined : filters.start_date
              set({ start_date: start, end_date: nextEnd })
            }}
          />
        </LabeledField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map(({ key, labelKey }) => {
            const range = datePresetRange(key)
            const active = filters.start_date === range.start && filters.end_date === range.end
            return (
              <Button
                key={key}
                type="button"
                size="xs"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => applyPreset(key)}
              >
                {t(`filters.${labelKey}`)}
              </Button>
            )
          })}
        </div>

        {hasFilters && (
          <Button type="button" variant="ghost" size="xs" onClick={() => onChange({})}>
            <X className="size-3.5" aria-hidden="true" /> {t("filters.clear")}
          </Button>
        )}
      </div>
    </div>
  )
}
