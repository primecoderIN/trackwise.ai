// A part of the expenses feature's table: the toolbar above (and pagination strip below) the table showing result
// counts, visible page subtotal in BASE_CURRENCY, bulk delete controls, and numbered pagination. Used by ExpensesTable.

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { BASE_CURRENCY } from "@/shared/api/contracts.gen"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Button } from "@/shared/ui/button"

const PART_SEPARATOR = " · "

interface ExpensesToolbarProps {
  /** How many expenses match the filters. */
  total: number
  /** How many of them are loaded on this page. */
  shown: number
  /** Sum of shown rows in BASE_CURRENCY minor units (null hides subtotal). */
  pageTotalMinor?: number | null
  /** The index of the first shown row (0-based, for paging). */
  offset?: number
  /** How many rows fit on one page. */
  pageSize?: number
  /** Called with the new offset when Previous or Next page is clicked. */
  onOffsetChange?: (nextOffset: number) => void
  /** How many rows are ticked. */
  selected: number
  /** A delete is running: "Delete selected" waits. */
  deleting: boolean
  /** "Delete selected" was pressed. */
  onDeleteSelected: () => void
}

/**
 * The summary and bulk-action strip above the expenses table: count, page total, selection count, Delete selected,
 * and Previous / Next pagination with "Page X of Y".
 */
export function ExpensesToolbar({
  total,
  shown,
  pageTotalMinor = null,
  offset = 0,
  pageSize = shown,
  onOffsetChange,
  selected,
  deleting,
  onDeleteSelected,
}: ExpensesToolbarProps) {
  const t = useTranslations("expenses")
  const { formatMoney } = useFormatters()
  const showingText =
    offset > 0 && shown > 0
      ? t("toolbar.showingRange", { from: offset + 1, to: offset + shown })
      : total > shown
        ? t("toolbar.showingNewest", { shown })
        : null
  const pageTotalText =
    pageTotalMinor !== null && shown > 0
      ? t("toolbar.pageTotal", { amount: formatMoney(pageTotalMinor / 100, BASE_CURRENCY) })
      : null
  const parts = [
    t("toolbar.count", { count: total }),
    showingText,
    pageTotalText,
    selected > 0 ? t("toolbar.selected", { count: selected }) : null,
  ]
  const hasPaging = onOffsetChange !== undefined && pageSize > 0 && (total > pageSize || offset > 0)
  const currentPage = pageSize > 0 ? Math.floor(offset / pageSize) + 1 : 1
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

  return (
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:text-sm">
      <span className="tabular-nums">{parts.filter((part) => part !== null).join(PART_SEPARATOR)}</span>
      <div className="flex flex-wrap items-center gap-2">
        {selected > 0 && (
          <Button size="sm" variant="destructive" disabled={deleting} onClick={onDeleteSelected}>
            <Trash2 className="size-3.5" /> {t("toolbar.deleteSelected")}
          </Button>
        )}
        {hasPaging && (
          <ExpensesPagination
            page={currentPage}
            totalPages={totalPages}
            canPrev={offset > 0}
            canNext={offset + shown < total}
            onPrev={() => onOffsetChange(Math.max(0, offset - pageSize))}
            onNext={() => onOffsetChange(offset + pageSize)}
          />
        )}
      </div>
    </div>
  )
}

/** Compact pagination strip reusable above and beneath the table. */
export function ExpensesPagination({
  page,
  totalPages,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  const t = useTranslations("expenses")
  return (
    <div className="flex items-center gap-1.5">
      <span className="px-1 text-xs text-muted-foreground tabular-nums">
        {t("toolbar.pageOf", { page, pages: totalPages })}
      </span>
      <Button
        size="icon-xs"
        variant="outline"
        aria-label={t("toolbar.previousPage")}
        disabled={!canPrev}
        onClick={onPrev}
      >
        <ChevronLeft className="size-3.5" />
      </Button>
      <Button size="icon-xs" variant="outline" aria-label={t("toolbar.nextPage")} disabled={!canNext} onClick={onNext}>
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  )
}
