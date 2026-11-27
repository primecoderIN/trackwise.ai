// The Categories page (/categories): colour-coded category cards with monthly spend, share progress bar, sort toggle,
// shared MonthPicker, and working deep-links to Expenses filtered by that category and month. Part of categories.

import { ArrowUpRight, Info, Tags } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { MonthPicker } from "@/shared/components/month-picker"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { currentMonth, monthDateRange } from "@/shared/lib/format"
import { queryGroupStatus } from "@/shared/lib/query-status"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

import { categoryVisual } from "../category-icons"
import { useCategories, useCategoryMonthlySummary } from "../queries"

type SortMode = "spend" | "name"

function filteredExpensesHref(categoryId: number, month: string): string {
  const params = new URLSearchParams({ category_id: String(categoryId) })
  const range = monthDateRange(month)
  if (range) {
    params.set("start_date", range.start)
    params.set("end_date", range.end)
  }
  return `${ROUTES.expenses}?${params.toString()}`
}

/** The Categories page: shared categories with colour-coded icons, share meters, sorting, and filtered drill-downs. */
export function CategoriesPage() {
  const t = useTranslations("categories")
  const messageOf = useMessageOf()
  const { formatMoney, formatMonth } = useFormatters()
  const [month, setMonth] = useState(currentMonth)
  const [sortBy, setSortBy] = useState<SortMode>("spend")
  const categories = useCategories()
  const summary = useCategoryMonthlySummary(month)
  const { failed, retrying, retry } = queryGroupStatus([categories, summary])

  const rows = useMemo(() => {
    if (!categories.data || !summary.data) return null
    const totalsById = new Map(summary.data.by_category.map((item) => [item.category_id, item]))
    const monthTotalMinor = summary.data.total_minor
    const mapped = categories.data.map((category) => {
      const spent = totalsById.get(category.id)
      const totalMinor = spent?.total_minor ?? 0
      const sharePercent = monthTotalMinor > 0 && totalMinor > 0 ? Math.round((totalMinor / monthTotalMinor) * 100) : 0
      return {
        category,
        total: spent?.total ?? "0.00",
        totalMinor,
        expenseCount: spent?.expense_count ?? 0,
        sharePercent,
      }
    })
    return [...mapped].sort((a, b) =>
      sortBy === "spend"
        ? b.totalMinor - a.totalMinor || a.category.name.localeCompare(b.category.name)
        : a.category.name.localeCompare(b.category.name),
    )
  }, [categories.data, summary.data, sortBy])

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-border/80 bg-card p-0.5 shadow-2xs">
        <Button
          type="button"
          size="xs"
          variant={sortBy === "spend" ? "secondary" : "ghost"}
          aria-pressed={sortBy === "spend"}
          onClick={() => setSortBy("spend")}
        >
          {t("page.sortBySpend")}
        </Button>
        <Button
          type="button"
          size="xs"
          variant={sortBy === "name" ? "secondary" : "ghost"}
          aria-pressed={sortBy === "name"}
          onClick={() => setSortBy("name")}
        >
          {t("page.sortByName")}
        </Button>
      </div>
      <MonthPicker month={month} onChange={setMonth} />
    </div>
  )

  const headerDescription = t("page.description", { currency: summary.data?.currency ?? DEFAULT_CURRENCY })
  if (!rows || !summary.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("page.title")} description={headerDescription} actions={headerActions} />
        {failed ? (
          <SectionError
            title={t("page.loadFailed")}
            message={messageOf(failed.error)}
            onRetry={retry}
            retrying={retrying}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}
      </div>
    )
  }

  const monthLabel = formatMonth(month)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("page.title")} description={headerDescription} actions={headerActions} />
      {failed && <RefreshNotice message={messageOf(failed.error)} onRetry={retry} retrying={retrying} />}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState icon={Tags} message={t("page.empty")} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ category, total, totalMinor, expenseCount, sharePercent }) => {
            const visual = categoryVisual(category.icon)
            const Icon = visual.icon
            const inactive = totalMinor === 0
            return (
              <Card
                key={category.id}
                className={`transition-all hover:border-border hover:shadow-sm ${inactive ? "opacity-80 hover:opacity-100" : ""}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${visual.tileClass}`}>
                      <Icon className="size-4.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{category.name}</CardTitle>
                      <CardDescription className="truncate text-xs">
                        {t("card.expenses", { count: expenseCount, month: monthLabel })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-1">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
                        {formatMoney(total, summary.data.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {t("card.share", { percent: sharePercent })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      asChild
                      className="gap-1 text-muted-foreground hover:text-primary"
                    >
                      <Link href={filteredExpensesHref(category.id, month)}>
                        <span>{t("card.viewExpenses")}</span>
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sharePercent}%`, backgroundColor: visual.chartColor }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/25 px-4 py-2.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{t("card.customSoon")}</span>
      </div>
    </div>
  )
}
