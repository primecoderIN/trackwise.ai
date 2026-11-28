// A component of the expenses feature: the expenses table (TanStack Table) on desktop and stacked card list on
// mobile, wired to the slide-over EditExpenseSheet, skeleton loading rows, refetch dimming, and top/bottom paging.

import { SkeletonItem } from "@primecoderin/fast-ui-react"
import { flexRender, useTable, type Row, type RowSelectionState } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import { useCallback, useMemo, useState } from "react"

import { useCategoryLookup, useCategoryName } from "@/features/categories"
import { useLanguage } from "@/shared/i18n"
import { useFormatters } from "@/shared/lib/use-formatters"

import type { Expense } from "../../api"
import { useIsDeletingExpenses } from "../../queries"
import { EditExpenseSheet } from "../dialogs/edit-expense-sheet"
import { ariaSortOf, expenseColumns, expenseTableFeatures } from "./expense-columns"
import { ExpenseMobileList } from "./expense-mobile-list"
import { ExpensesPagination, ExpensesToolbar } from "./expenses-toolbar"
import { useExpenseEditor } from "./use-expense-editor"

interface ExpensesTableProps {
  /** The rows to show (the newest first, as the API sends them). */
  expenses: Expense[]
  /** How many match the filters; `expenses` may hold fewer (the API's limit). */
  total: number
  /** Nothing has loaded yet: skeleton rows show. */
  loading: boolean
  /** Background refresh in progress while keeping previous rows on screen. */
  fetching?: boolean
  /** Asks the page to confirm and delete these expenses (one row, or all selected rows). */
  onDelete: (expenses: Expense[]) => void
  /** The 0-based offset of the current page. */
  offset?: number
  /** The maximum number of rows per page. */
  pageSize?: number
  /** Moves to another page offset. */
  onOffsetChange?: (nextOffset: number) => void
}

function useSelectionOf(expenses: Expense[]) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [selectionFor, setSelectionFor] = useState(expenses)
  if (selectionFor !== expenses) {
    setSelectionFor(expenses)
    setRowSelection({})
  }
  return [rowSelection, setRowSelection] as const
}

/**
 * The expenses view: toolbar with page subtotal & bulk actions, desktop 7-column table, mobile card list, bottom
 * pagination, and slide-over EditExpenseSheet.
 */
export function ExpensesTable({
  expenses,
  total,
  loading,
  fetching = false,
  onDelete,
  offset = 0,
  pageSize = expenses.length,
  onOffsetChange,
}: ExpensesTableProps) {
  const t = useTranslations("expenses")
  const { language } = useLanguage()
  const { formatDate } = useFormatters()
  const editor = useExpenseEditor()
  const deleting = useIsDeletingExpenses()
  const categoryName = useCategoryName()
  const categoryOf = useCategoryLookup()
  const categoryIconName = useCallback((id: number) => categoryOf(id)?.icon, [categoryOf])
  const [rowSelection, setRowSelection] = useSelectionOf(expenses)

  const columns = useMemo(
    () =>
      expenseColumns({
        t,
        language,
        formatDate,
        categoryName,
        categoryIconName,
        deleting,
        onEdit: editor.start,
        onDelete,
      }),
    [t, language, formatDate, categoryName, categoryIconName, deleting, editor.start, onDelete],
  )

  const table = useTable({
    features: expenseTableFeatures,
    columns,
    data: expenses,
    getRowId: (expense) => String(expense.id),
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })

  const selected = table.getSelectedRowModel().rows.map((row) => row.original)
  const editingExpense = useMemo(
    () => (editor.editingId !== null ? (expenses.find((item) => item.id === editor.editingId) ?? null) : null),
    [expenses, editor.editingId],
  )
  const pageTotalMinor = useMemo(
    () =>
      expenses.length > 0
        ? expenses.reduce((sum, item) => sum + (item.base_amount_minor ?? item.amount_minor), 0)
        : null,
    [expenses],
  )

  const hasPaging = onOffsetChange !== undefined && pageSize > 0 && (total > pageSize || offset > 0)
  const currentPage = pageSize > 0 ? Math.floor(offset / pageSize) + 1 : 1
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

  return (
    <div className="flex flex-col gap-3">
      <ExpensesToolbar
        total={total}
        shown={expenses.length}
        pageTotalMinor={pageTotalMinor}
        offset={offset}
        pageSize={pageSize}
        onOffsetChange={onOffsetChange}
        selected={selected.length}
        deleting={deleting}
        onDeleteSelected={() => onDelete(selected)}
      />

      <ExpenseMobileList
        expenses={expenses}
        loading={loading}
        deleting={deleting}
        selectedIds={rowSelection}
        onToggleSelect={(id, checked) =>
          setRowSelection((prev) => {
            const next = { ...prev }
            if (checked) next[id] = true
            else delete next[id]
            return next
          })
        }
        onEdit={editor.start}
        onDelete={onDelete}
      />

      <div
        className={`hidden overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-opacity lg:block ${
          fetching && !loading ? "opacity-65" : "opacity-100"
        }`}
      >
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line-subtle">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    aria-sort={ariaSortOf(header.column.getIsSorted())}
                    className="h-11 px-3 text-start align-middle text-xs font-semibold text-fg-secondary"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <ExpenseRows rows={table.getRowModel().rows} columnCount={columns.length} loading={loading} />
        </table>
      </div>

      {hasPaging && (
        <div className="flex justify-end pt-1">
          <ExpensesPagination
            page={currentPage}
            totalPages={totalPages}
            canPrev={offset > 0}
            canNext={offset + expenses.length < total}
            onPrev={() => onOffsetChange(Math.max(0, offset - pageSize))}
            onNext={() => onOffsetChange(offset + pageSize)}
          />
        </div>
      )}

      <EditExpenseSheet
        expense={editingExpense}
        saving={editingExpense !== null && editor.isSaving(editingExpense.id)}
        deleting={deleting}
        onSave={editor.save}
        onDelete={(item) => onDelete([item])}
        onClose={editor.cancel}
      />
    </div>
  )
}

function ExpenseRows({
  rows,
  columnCount,
  loading,
}: {
  rows: Row<typeof expenseTableFeatures, Expense>[]
  columnCount: number
  loading: boolean
}) {
  const t = useTranslations("expenses")
  if (loading) {
    return (
      <tbody>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <tr key={index} className="border-b border-line-subtle">
            <td colSpan={columnCount} className="px-3 py-3">
              <SkeletonItem className="h-7 w-full rounded-md" />
            </td>
          </tr>
        ))}
      </tbody>
    )
  }
  return (
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={columnCount} className="h-28 text-center text-fg-secondary">
            {t("table.noMatches")}
          </td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr
            key={row.id}
            data-state={row.getIsSelected() ? "selected" : undefined}
            className="border-b border-line-subtle transition-colors hover:bg-surface-hover data-[state=selected]:bg-selected"
          >
            {row.getAllCells().map((cell) => (
              <td key={cell.id} className="px-3 py-2.5 align-middle">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  )
}
