// A component of the dashboard feature: the row of three headline KPI cards at the top of the Dashboard, featuring
// month-over-month delta badges, average spend per transaction, and colour-coded top category insight.

import { Card, StatusBadge, Tag } from "@primecoderin/fast-ui-react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { ArrowDownRight, ArrowUpRight, Minus, ReceiptText, TrendingUp, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"

import { categoryVisual, useCategoryLookup } from "@/features/categories"
import { useFormatters } from "@/shared/lib/use-formatters"

import type { MonthlySummary } from "../api"

interface StatCardsProps {
  summary: MonthlySummary
  /** Prior month's spend in minor units from the trend series, or null when unavailable. */
  previousTotalMinor: number | null
}

function DeltaBadge({ currentMinor, previousMinor }: { currentMinor: number; previousMinor: number | null }) {
  const t = useTranslations("dashboard")
  if (previousMinor === null || previousMinor <= 0) return null
  const pct = Math.round(((currentMinor - previousMinor) / previousMinor) * 100)
  if (pct === 0) {
    return (
      <Tag className="gap-1">
        <Minus className="size-3" aria-hidden="true" />
        {t("stats.vsLastMonthSame")}
      </Tag>
    )
  }
  if (pct > 0) {
    return (
      <StatusBadge tone="warning" className="gap-1 tabular-nums">
        <ArrowUpRight className="size-3" aria-hidden="true" />
        {t("stats.vsLastMonthUp", { percent: pct })}
      </StatusBadge>
    )
  }
  return (
    <StatusBadge tone="success" className="gap-1 tabular-nums">
      <ArrowDownRight className="size-3" aria-hidden="true" />
      {t("stats.vsLastMonthDown", { percent: Math.abs(pct) })}
    </StatusBadge>
  )
}

/**
 * Three headline numbers for the selected month: total spent (with MoM delta), transactions & average ticket, and
 * top category with its icon tint and spend share.
 */
export function StatCards({ summary, previousTotalMinor }: StatCardsProps) {
  const t = useTranslations("dashboard")
  const { formatCount, formatMoney, formatMonth } = useFormatters()
  const categoryOf = useCategoryLookup()
  const top = summary.by_category[0]
  const topVisual = top ? categoryVisual(categoryOf(top.category_id)?.icon) : null
  const TopIcon = topVisual?.icon ?? TrendingUp
  const monthName = formatMonth(summary.month)
  const averageMinor = summary.expense_count > 0 ? summary.total_minor / summary.expense_count : 0
  const topShare = top && summary.total_minor > 0 ? Math.round((top.total_minor / summary.total_minor) * 100) : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
          <div className="grid min-w-0 gap-1.5">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              {t("stats.spentIn", { month: monthName })}
            </CardDescription>
            <CardTitle className="truncate text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatMoney(summary.total, summary.currency)}
            </CardTitle>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-4.5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <DeltaBadge currentMinor={summary.total_minor} previousMinor={previousTotalMinor} />
          {previousTotalMinor === null || previousTotalMinor <= 0 ? (
            <span>{summary.expense_count === 0 ? t("stats.noExpensesThisMonth") : t("stats.totalOfMonth")}</span>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
          <div className="grid min-w-0 gap-1.5">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              {t("stats.expensesThisMonth")}
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatCount(summary.expense_count)}
            </CardTitle>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info-foreground">
            <ReceiptText className="size-4.5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
          <span>{t("stats.categoriesUsed", { count: summary.by_category.length })}</span>
          {summary.expense_count > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("stats.averageExpense", { amount: formatMoney(averageMinor / 100, summary.currency) })}</span>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 xl:col-span-1">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
          <div className="grid min-w-0 gap-1.5">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              {t("stats.topCategory")}
            </CardDescription>
            <CardTitle className="truncate text-xl font-bold tracking-tight sm:text-2xl" title={top?.category_name}>
              {top ? top.category_name : "—"}
            </CardTitle>
          </div>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              topVisual ? topVisual.tileClass : "bg-muted text-muted-foreground"
            }`}
          >
            <TopIcon className="size-4.5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums">
          {top ? (
            <>
              <span className="font-medium text-foreground">
                {t("stats.topAcross", { amount: formatMoney(top.total, summary.currency), count: top.expense_count })}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t("stats.topShare", { percent: topShare })}</span>
            </>
          ) : (
            <span>{t("stats.nothingSpent")}</span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
