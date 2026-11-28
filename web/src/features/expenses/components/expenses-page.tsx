// A component of the expenses feature: the Expenses page, the feature's main export. Syncs filters with URL query
// parameters (so Categories and Dashboard drill-downs work directly), handles `?add=1` deep-links, and lays out the
// filter card, responsive table/cards, Add dialog, and Delete confirmation.

import { Card } from "@primecoderin/fast-ui-react"
import { CardContent } from "@/shared/components/card-parts"
import { ReceiptText } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { LIMITS } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { Expense, ExpenseFilters } from "../api"
import { filtersFromSearchParams, filtersToQueryString } from "../filter-params"
import { useExpenses } from "../queries"
import { AddExpenseDialog } from "./dialogs/add-expense-dialog"
import { DeleteExpensesDialog } from "./dialogs/delete-expenses-dialog"
import { FiltersBar } from "./filters/filters-bar"
import { ExpensesTable } from "./table/expenses-table"

const FILTER_DEBOUNCE_MS = 280
const NO_EXPENSES: Expense[] = []

/**
 * The Expenses page: URL-synced filters, Add Expense dialog, desktop table & mobile card list, and delete dialog.
 */
export function ExpensesPage() {
  const t = useTranslations("expenses")
  const messageOf = useMessageOf()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()

  const addParam = searchParams.get("add")
  const [addOpen, setAddOpen] = useState(() => addParam === "1")
  const [lastAddParam, setLastAddParam] = useState(addParam)
  if (addParam !== lastAddParam) {
    setLastAddParam(addParam)
    if (addParam === "1") setAddOpen(true)
  }

  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState<ExpenseFilters>(() => filtersFromSearchParams(searchParams))
  const [lastSearchKey, setLastSearchKey] = useState(searchKey)
  if (searchKey !== lastSearchKey) {
    setLastSearchKey(searchKey)
    const fromUrl = filtersFromSearchParams(searchParams)
    if (filtersToQueryString(fromUrl) !== filtersToQueryString(filters)) {
      setFilters(fromUrl)
      setOffset(0)
    }
  }

  const [pendingDelete, setPendingDelete] = useState<Expense[] | null>(null)
  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS)
  const expenses = useExpenses({ ...debouncedFilters, limit: LIMITS.listDefault, offset })

  function handleFiltersChange(nextFilters: ExpenseFilters) {
    setFilters(nextFilters)
    setOffset(0)
    const nextQuery = filtersToQueryString(nextFilters)
    setLastSearchKey(nextQuery)
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  function handleAddOpenChange(next: boolean) {
    setAddOpen(next)
    if (!next && searchParams.get("add") === "1") {
      const nextQuery = filtersToQueryString(filters)
      setLastSearchKey(nextQuery)
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    }
  }

  if (expenses.data && offset > 0 && expenses.data.items.length === 0 && expenses.data.total > 0) {
    const lastPageOffset = Math.max(0, Math.floor((expenses.data.total - 1) / LIMITS.listDefault) * LIMITS.listDefault)
    if (lastPageOffset !== offset) setOffset(lastPageOffset)
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.category_id || filters.start_date || filters.end_date || filters.merchant,
  )
  const isFirstTimeEmpty = Boolean(expenses.data && expenses.data.total === 0 && !hasActiveFilters && offset === 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("page.title")}
        description={t("page.description")}
        actions={<AddExpenseDialog open={addOpen} onOpenChange={handleAddOpenChange} />}
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
              action={{ label: t("add.open"), onClick: () => setAddOpen(true), primary: true }}
            />
          </CardContent>
        </Card>
      ) : (
        <ExpensesTable
          expenses={expenses.data?.items ?? NO_EXPENSES}
          total={expenses.data?.total ?? 0}
          loading={expenses.isPending}
          fetching={expenses.isFetching}
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
