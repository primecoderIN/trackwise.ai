// A part of the expenses feature's table: the button in a sortable column's header. Its own file because it's a
// component, and expense-columns.tsx (which places it, through sortableHeader) exports only plain functions. Its
// label comes from the feature's i18n namespace.

import { Button } from "@primecoderin/fast-ui-react"
import type { SortDirection } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useTranslations } from "next-intl"

interface SortButtonProps {
  /** The column's title, already translated: shown on the button and in its label ("Sort by Date"). */
  title: string
  /** The column's current direction; false while it isn't sorted. */
  sorted: false | SortDirection
  /** TanStack's toggle handler for the column (undefined if it can't sort). */
  onClick?: (event: unknown) => void
}

/** A column header you can click to sort; the arrow shows the current direction (both ways while unsorted). */
export function SortButton({ title, sorted, onClick }: SortButtonProps) {
  const t = useTranslations("expenses")
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown
  return (
    <Button
      variant="subtle"
      size="small"
      className="-mx-2.5"
      onClick={onClick}
      aria-label={t("table.sortBy", { column: title })}
    >
      {title}
      <Icon className="size-3.5" />
    </Button>
  )
}
