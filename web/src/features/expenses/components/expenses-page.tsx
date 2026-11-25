// A component of the expenses feature: the Expenses page, the feature's main export
// (app/(client)/(app)/expenses/page.tsx draws it). It holds the page's state (the filters, and which expenses are
// waiting for "are you sure?"), loads the list through useExpenses, and lays out its parts: the Add dialog, the filters
// bar, the table, and the delete dialog. Its texts come from the feature's i18n namespace.

import { ReceiptText } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { LIMITS } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Card, CardContent } from "@/shared/ui/card"

import type { Expense, ExpenseFilters } from "../api"
import { useExpenses } from "../queries"
import { AddExpenseDialog } from "./dialogs/add-expense-dialog"
import { DeleteExpensesDialog } from "./dialogs/delete-expenses-dialog"
import { ExpensesTable } from "./table/expenses-table"
import { FiltersBar } from "./filters/filters-bar"

// Wait this long after the last change before asking the API, so typing in Search doesn't send a
// request on every key.
const FILTER_DEBOUNCE_MS = 300

// What the table gets while nothing is loaded: one array, the same on every render. A new `[]` each time would
// count as new data, and the table clears its selection whenever its data changes. Never modified.
const NO_EXPENSES: Expense[] = []

/**
 * The Expenses page: a title with the Add button, the filters, the table, and the delete confirmation. If
 * nothing could be loaded, an error card with Try again takes the table's place; if a reload fails, the rows
 * stay and a "couldn't refresh" notice appears above them.
 */
export function ExpensesPage() {
  const t = useTranslations("expenses")
  const messageOf = useMessageOf()
  const searchParams = useSearchParams()
  const addParam = searchParams.get("add")
  const [addOpen, setAddOpen] = useState(() => addParam === "1")
  const [lastAddParam, setLastAddParam] = useState(addParam)
  if (addParam !== lastAddParam) {
    setLastAddParam(addParam)
    if (addParam === "1") setAddOpen(true)
  }
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [offset, setOffset] = useState(0)
  // The expenses waiting for "are you sure?"; null means the confirmation dialog is closed.
  const [pendingDelete, setPendingDelete] = useState<Expense[] | null>(null)
  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS)
  const expenses = useExpenses({ ...debouncedFilters, limit: LIMITS.listDefault, offset })

  function handleFiltersChange(nextFilters: ExpenseFilters) {
    setFilters(nextFilters)
    setOffset(0)
  }

  // If deleting every item on the last page leaves it empty while earlier pages still have rows, step back one page.
  if (expenses.data && offset > 0 && expenses.data.items.length === 0 && expenses.data.total > 0) {
    const lastPageOffset = Math.max(0, Math.floor((expenses.data.total - 1) / LIMITS.listDefault) * LIMITS.listDefault)
    if (lastPageOffset !== offset) setOffset(lastPageOffset)
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.category_id || filters.start_date || filters.end_date || filters.merchant,
  )
  const isFirstTimeEmpty = Boolean(expenses.data && expenses.data.total === 0 && !hasActiveFilters && offset === 0)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("page.title")}
        description={t("page.description")}
        actions={<AddExpenseDialog open={addOpen} onOpenChange={setAddOpen} />}
      />

      <FiltersBar filters={filters} onChange={handleFiltersChange} />

      {expenses.isError && expenses.data && (
        <RefreshNotice
          message={messageOf(expenses.error)}
          onRetry={() => expenses.refetch()}
          retrying={expenses.isFetching}
        />
      )}
      {expenses.isError && !expenses.data ? (
        <SectionError
          title={t("page.loadFailed")}
          message={messageOf(expenses.error)}
          onRetry={() => expenses.refetch()}
          retrying={expenses.isFetching}
        />
      ) : isFirstTimeEmpty ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={ReceiptText}
              title={t("table.emptyTitle")}
              message={t("table.emptyDescription")}
              action={{ label: t("add.open"), onClick: () => setAddOpen(true) }}
            />
          </CardContent>
        </Card>
      ) : (
        <ExpensesTable
          expenses={expenses.data?.items ?? NO_EXPENSES}
          total={expenses.data?.total ?? 0}
          loading={expenses.isPending}
          onDelete={setPendingDelete}
          offset={offset}
          pageSize={LIMITS.listDefault}
          onOffsetChange={setOffset}
        />
      )}

      <DeleteExpensesDialog expenses={pendingDelete} onClose={() => setPendingDelete(null)} />
    </div>
  )
}
