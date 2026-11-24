// The Categories page (/categories): every shared category with its icon, this month's spend and expense count, and a
// month selector to inspect any month. Part of the categories feature (Phase 28).

import { ChevronLeft, ChevronRight, Tags } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { messageOf } from "@/shared/lib/errors"
import {
  currentMonth,
  formatCount,
  formatMoney,
  formatMonth,
  MAX_MONTH,
  MIN_MONTH,
  shiftMonth,
} from "@/shared/lib/format"
import { queryGroupStatus } from "@/shared/lib/query-status"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

import { categoryIcon } from "../category-icons"
import { useTexts } from "../i18n"
import { useCategories, useCategoryMonthlySummary } from "../queries"

/** The Categories page: shared categories with each one's icon and monthly spend. */
export function CategoriesPage() {
  const { t } = useTexts()
  const [month, setMonth] = useState(currentMonth)
  const categories = useCategories()
  const summary = useCategoryMonthlySummary(month)
  const { failed, retrying, retry } = queryGroupStatus([categories, summary])
  const step = (offset: number) => () => setMonth((current) => shiftMonth(current, offset))

  const rows = useMemo(() => {
    if (!categories.data || !summary.data) return null
    const totalsById = new Map(summary.data.by_category.map((item) => [item.category_id, item]))
    const monthTotalMinor = summary.data.total_minor
    return categories.data.map((category) => {
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
  }, [categories.data, summary.data])

  const monthControls = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("page.previousMonth")}
        onClick={step(-1)}
        disabled={month <= MIN_MONTH}
      >
        <ChevronLeft />
      </Button>
      <span aria-live="polite" className="min-w-32 text-center text-sm font-medium">
        {formatMonth(month)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("page.nextMonth")}
        onClick={step(1)}
        disabled={month >= MAX_MONTH}
      >
        <ChevronRight />
      </Button>
    </div>
  )

  const headerDescription = t("page.description", { currency: summary.data?.currency ?? DEFAULT_CURRENCY })
  if (!rows || !summary.data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title={t("page.title")} description={headerDescription} actions={monthControls} />
        {failed ? (
          <SectionError
            title={t("page.loadFailed")}
            message={messageOf(failed.error)}
            onRetry={retry}
            retrying={retrying}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}
      </div>
    )
  }

  const monthLabel = formatMonth(month)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("page.title")} description={headerDescription} actions={monthControls} />
      {failed && <RefreshNotice message={messageOf(failed.error)} onRetry={retry} retrying={retrying} />}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState icon={Tags} message={t("page.empty")} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ category, total, totalMinor, expenseCount, sharePercent }) => {
            const Icon = categoryIcon(category.icon)
            return (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription>
                        {t("card.expenses", {
                          count: expenseCount,
                          formattedCount: formatCount(expenseCount),
                          month: monthLabel,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-2 pt-2">
                  <div>
                    <p className="text-xl font-semibold tabular-nums">{formatMoney(total, summary.data.currency)}</p>
                    {totalMinor > 0 && (
                      <p className="text-xs text-muted-foreground">{t("card.share", { percent: sharePercent })}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={ROUTES.expenses}>{t("card.viewExpenses")}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("card.customSoon")}</p>
    </div>
  )
}
