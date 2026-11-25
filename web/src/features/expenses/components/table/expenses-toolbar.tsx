// A part of the expenses feature's table: the line above it, with the count ("140 expenses · showing the newest
// 100 · 2 selected") and "Delete selected" while any row is ticked. Its texts (with each language's plural forms)
// come from the feature's i18n namespace. Used by expenses-table.tsx.

import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"

// What goes between the count line's parts.
const PART_SEPARATOR = " · "

interface ExpensesToolbarProps {
  /** How many expenses match the filters. */
  total: number
  /** How many of them are loaded into the table (the API sends at most a page). */
  shown: number
  /** The index of the first shown row (0-based, for paging). */
  offset?: number
  /** How many rows fit on one page. */
  pageSize?: number
  /** Called with the new offset when Previous or Next page is clicked. */
  onOffsetChange?: (nextOffset: number) => void
  /** How many rows are ticked. */
  selected: number
  /** A delete is running: "Delete selected" waits, so the same rows can't be sent twice. */
  deleting: boolean
  /** "Delete selected" was pressed: the table asks the page to confirm the ticked rows. */
  onDeleteSelected: () => void
}

/**
 * The count line above the expenses table. It says how many match, adds "showing the newest N" (or "showing A–B" when
 * paged) when the table holds fewer than that, and "N selected" while rows are ticked; "Delete selected" shows only
 * then, and Previous / Next buttons appear when there is more than one page.
 */
export function ExpensesToolbar({
  total,
  shown,
  offset = 0,
  pageSize = shown,
  onOffsetChange,
  selected,
  deleting,
  onDeleteSelected,
}: ExpensesToolbarProps) {
  const t = useTranslations("expenses")
  const showingText =
    offset > 0 && shown > 0
      ? t("toolbar.showingRange", { from: offset + 1, to: offset + shown })
      : total > shown
        ? t("toolbar.showingNewest", { shown })
        : null
  // Each part is a whole phrase of its own, so it reads right in every language whichever parts are shown.
  const parts = [
    t("toolbar.count", { count: total }),
    showingText,
    selected > 0 ? t("toolbar.selected", { count: selected }) : null,
  ]
  const hasPaging = onOffsetChange !== undefined && pageSize > 0 && (total > pageSize || offset > 0)

  return (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{parts.filter((part) => part !== null).join(PART_SEPARATOR)}</span>
      <div className="flex items-center gap-2">
        {selected > 0 && (
          <Button size="sm" variant="destructive" disabled={deleting} onClick={onDeleteSelected}>
            <Trash2 /> {t("toolbar.deleteSelected")}
          </Button>
        )}
        {hasPaging && (
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t("toolbar.previousPage")}
              disabled={offset <= 0}
              onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t("toolbar.nextPage")}
              disabled={offset + shown >= total}
              onClick={() => onOffsetChange(offset + pageSize)}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
