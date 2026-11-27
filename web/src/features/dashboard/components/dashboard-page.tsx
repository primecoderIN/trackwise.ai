// A component of the dashboard feature: the Dashboard page, the feature's main export. Supports stepping across
// months with the shared MonthPicker, computes month-over-month delta from the trend series, and lays out the KPI
// cards, budget pace summary, interactive multi-colour charts, and enriched recent expenses list.

import { useTranslations } from "next-intl"
import { useState } from "react"

import { useCategories } from "@/features/categories"
import { useExpenses } from "@/features/expenses"
import { DEFAULT_CURRENCY, LIMITS } from "@/shared/api/contracts.gen"
import { MonthPicker } from "@/shared/components/month-picker"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { currentMonth, shiftMonth } from "@/shared/lib/format"
import { queryGroupStatus } from "@/shared/lib/query-status"
import { useMessageOf } from "@/shared/lib/use-message-of"

import { useMonthlySummary, useMonthlyTrend } from "../queries"
import { BudgetCard } from "./budget-card"
import { CategoryChart } from "./category-chart"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { RecentExpenses } from "./recent-expenses"
import { StatCards } from "./stat-cards"
import { TrendChart } from "./trend-chart"

const RECENT_COUNT = 5

/**
 * The Dashboard: selectable month overview with headline KPIs, budget pace card, interactive category and trend
 * charts, and latest expenses.
 */
export function DashboardPage() {
  const t = useTranslations("dashboard")
  const messageOf = useMessageOf()
  const [month, setMonth] = useState(currentMonth)
  const summary = useMonthlySummary(month)
  const trend = useMonthlyTrend(LIMITS.trendMonthsDefault)
  const recent = useExpenses({ limit: RECENT_COUNT })
  const categories = useCategories()
  const { failed, retrying, retry } = queryGroupStatus([summary, trend, recent, categories])

  const header = (
    <PageHeader
      title={t("page.title")}
      description={t("page.description", { currency: summary.data?.currency ?? DEFAULT_CURRENCY })}
      actions={<MonthPicker month={month} onChange={setMonth} maxMonth={currentMonth()} />}
    />
  )

  if (!summary.data || !trend.data || !recent.data || !categories.data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        {failed ? (
          <SectionError
            title={t("page.loadFailed")}
            message={messageOf(failed.error)}
            onRetry={retry}
            retrying={retrying}
          />
        ) : (
          <DashboardSkeleton />
        )}
      </div>
    )
  }

  const prevMonthKey = shiftMonth(month, -1)
  const prevMonthPoint = trend.data.months.find((entry) => entry.month === prevMonthKey)

  return (
    <div className="flex flex-col gap-6">
      {header}
      {failed && <RefreshNotice message={messageOf(failed.error)} onRetry={retry} retrying={retrying} />}
      <StatCards summary={summary.data} previousTotalMinor={prevMonthPoint?.total_minor ?? null} />
      <BudgetCard month={summary.data.month} />
      <div className="grid gap-5 xl:grid-cols-2">
        <CategoryChart summary={summary.data} />
        <TrendChart trend={trend.data} />
      </div>
      <RecentExpenses expenses={recent.data.items} />
    </div>
  )
}
