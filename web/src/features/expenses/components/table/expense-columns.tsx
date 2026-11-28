// A part of the expenses feature's table: TanStack Table v9 column definitions with compact 7-column density,
// colour-coded category pills, truncated inline notes under merchant, and clean right-aligned amounts & actions.

import { Button, CheckboxBox, Tag } from "@primecoderin/fast-ui-react"
import {
  createColumnHelper,
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  type Column_RowSorting,
  type SortDirection,
} from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import type { useTranslations } from "next-intl"

import { categoryVisual } from "@/features/categories"
import { ExpenseMoney } from "@/shared/components/money"
import type { Language } from "@/shared/i18n"

import type { Expense } from "../../api"
import { paymentMethodLabel } from "../../payment-methods"
import { SortButton } from "./sort-button"

/** TanStack Table features opted into by the expenses table: client sorting and row selection. */
export const expenseTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
})

const columnHelper = createColumnHelper<typeof expenseTableFeatures, Expense>()
const ARIA_SORT = { asc: "ascending", desc: "descending" } as const

/** The header cell's aria-sort for a column's direction; undefined for an unsorted column. */
export function ariaSortOf(sorted: false | SortDirection) {
  return sorted ? ARIA_SORT[sorted] : undefined
}

type SortableColumn = Pick<
  Column_RowSorting<typeof expenseTableFeatures, Expense>,
  "getIsSorted" | "getToggleSortingHandler"
>

/** Sortable column header helper; aligns right when `align === "end"`. */
export function sortableHeader(title: string, align?: "end") {
  return ({ column }: { column: SortableColumn }) => {
    const button = <SortButton title={title} sorted={column.getIsSorted()} onClick={column.getToggleSortingHandler()} />
    return align === "end" ? <div className="flex justify-end">{button}</div> : button
  }
}

type ExpensesT = ReturnType<typeof useTranslations<"expenses">>

/** Dependencies passed from ExpensesTable when memoising columns. */
export interface ExpenseColumnOptions {
  t: ExpensesT
  language: Language
  formatDate: (value: string | Date) => string
  categoryName: (id: number) => string
  categoryIconName: (id: number) => string | undefined
  deleting: boolean
  onEdit: (id: number) => void
  onDelete: (expenses: Expense[]) => void
}

function selectColumn(t: ExpensesT) {
  return columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <CheckboxBox
        aria-label={t("table.selectAll")}
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(value)}
      />
    ),
    cell: ({ row }) => (
      <CheckboxBox
        aria-label={t("table.selectRow", { id: row.original.id })}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value)}
      />
    ),
    enableSorting: false,
  })
}

function dataColumns({
  categoryIconName,
  categoryName,
  formatDate,
  language,
  t,
}: Pick<ExpenseColumnOptions, "categoryIconName" | "categoryName" | "formatDate" | "language" | "t">) {
  return columnHelper.columns([
    columnHelper.accessor("spent_on", {
      header: sortableHeader(t("fields.date")),
      cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatDate(getValue())}</span>,
      sortFn: sortFn_alphanumeric,
    }),
    columnHelper.accessor("merchant", {
      header: sortableHeader(t("fields.merchant")),
      cell: ({ row }) => {
        const { id, merchant, note } = row.original
        return (
          <div className="flex max-w-xs flex-col gap-0.5 py-0.5 whitespace-normal">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-foreground">{merchant}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground/75 tabular-nums">#{id}</span>
            </div>
            {note && (
              <span className="truncate text-xs text-muted-foreground" title={note}>
                {note}
              </span>
            )}
          </div>
        )
      },
      sortFn: sortFn_alphanumeric,
    }),
    columnHelper.accessor((expense) => categoryName(expense.category_id), {
      id: "category",
      header: sortableHeader(t("fields.category")),
      cell: ({ row, getValue }) => {
        const visual = categoryVisual(categoryIconName(row.original.category_id))
        const Icon = visual.icon
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${visual.badgeClass}`}
          >
            <Icon className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{getValue()}</span>
          </span>
        )
      },
      sortFn: sortFn_alphanumeric,
    }),
    columnHelper.accessor("payment_method", {
      header: t("fields.paidWith"),
      cell: ({ getValue }) => <Tag>{paymentMethodLabel(getValue(), language)}</Tag>,
      enableSorting: false,
    }),
    columnHelper.accessor((expense) => expense.base_amount_minor ?? expense.amount_minor, {
      id: "amount",
      header: sortableHeader(t("fields.amount"), "end"),
      cell: ({ row }) => (
        <div className="text-right font-semibold text-foreground tabular-nums">
          <ExpenseMoney
            amount={row.original.amount}
            currency={row.original.currency}
            baseAmount={row.original.base_amount}
            rate={row.original.exchange_rate}
            rateDate={row.original.rate_date}
          />
        </div>
      ),
      sortFn: sortFn_basic,
    }),
  ])
}

function actionsColumn({ t, deleting, onEdit, onDelete }: ExpenseColumnOptions) {
  return columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">{t("table.actions")}</span>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button
          variant="icon"
          aria-label={t("table.editRow", { id: row.original.id })}
          onClick={() => onEdit(row.original.id)}
          size="small"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="icon"
          aria-label={t("table.deleteRow", { id: row.original.id })}
          disabled={deleting}
          onClick={() => onDelete([row.original])}
          size="small"
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
    ),
  })
}

/** Desktop table columns: select, date, merchant (+ #id & note), category pill, paid with, amount, and actions. */
export function expenseColumns(options: ExpenseColumnOptions) {
  return columnHelper.columns([selectColumn(options.t), ...dataColumns(options), actionsColumn(options)])
}
