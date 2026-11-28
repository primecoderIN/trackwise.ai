// The summary KPI cards and visual breakdown cards on the Reports page: spending by category (with category icons &
// colours), spending by payment method (with proportional bars), and ranked biggest expenses. Part of reports.

import { Card, StatusBadge, Tag } from "@primecoderin/fast-ui-react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { ArrowDownRight, ArrowUpRight, CalendarClock, Minus, TrendingUp, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { categoryVisual, useCategories } from "@/features/categories"
import { PAYMENT_METHOD_LABELS } from "@/shared/api/contracts.gen"
import { useLanguage } from "@/shared/i18n"
import { useFormatters } from "@/shared/lib/use-formatters"

import type { MonthlyReport } from "../api"

/** The summary KPI cards at the top of a monthly report: total spent, semantic MoM comparison, and daily average. */
export function ReportStatCards({ report }: { report: MonthlyReport }) {
  const t = useTranslations("reports")
  const { formatMoney } = useFormatters()
  const prevFormatted = formatMoney(report.previous_total, report.currency)
  const changePercent = report.change_percent
  const changeNum = changePercent !== null ? Number(changePercent) : null
  const changeLine =
    changeNum === null || changePercent === null
      ? t("stats.noPrevious")
      : changeNum > 0
        ? t("stats.changeUp", { percent: changePercent, amount: prevFormatted })
        : changeNum < 0
          ? t("stats.changeDown", { percent: changePercent, amount: prevFormatted })
          : t("stats.changeSame", { amount: prevFormatted })

  const deltaTone = changeNum === null || changeNum === 0 ? "neutral" : changeNum > 0 ? "warning" : "success"

  const DeltaIcon = changeNum === null || changeNum === 0 ? Minus : changeNum > 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
          <div className="grid min-w-0 gap-1.5">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              {t("stats.total")}
            </CardDescription>
            <CardTitle className="truncate text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatMoney(report.total, report.currency)}
            </CardTitle>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-4.5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {t("stats.expenses", { count: report.expense_count })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
          <div className="grid min-w-0 gap-1.5">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              {t("stats.previousMonth", { amount: prevFormatted })}
            </CardDescription>
            <CardTitle className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              <span>{changeNum === null ? "—" : `${changeNum > 0 ? "+" : ""}${report.change_percent}%`}</span>
              {changeNum !== null && (
                <StatusBadge tone={deltaTone} className="gap-0.5">
                  <DeltaIcon className="size-3" aria-hidden="true" />
                </StatusBadge>
              )}
            </CardTitle>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info-foreground">
            <TrendingUp className="size-4.5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">{changeLine}</CardContent>
      </Card>

      <Card className="sm:col-span-2 xl:col-span-1">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-1">
          <div className="grid min-w-0 gap-1.5">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">
              {t("stats.dailyAverage")}
            </CardDescription>
            <CardTitle className="truncate text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatMoney(report.daily_average, report.currency)}
            </CardTitle>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-positive-soft text-positive-foreground">
            <CalendarClock className="size-4.5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {t("stats.daysCounted", { count: report.days_counted })}
        </CardContent>
      </Card>
    </div>
  )
}

/** The category and payment-method visual breakdown cards, plus the month's biggest individual expenses. */
export function ReportBreakdowns({ report }: { report: MonthlyReport }) {
  const t = useTranslations("reports")
  const { language } = useLanguage()
  const { formatDate, formatMoney, formatMonth } = useFormatters()
  const { data: categories } = useCategories()
  const monthLabel = formatMonth(report.month)
  const labels = PAYMENT_METHOD_LABELS[language]

  const iconByName = useMemo(
    () => new Map((categories ?? []).map((cat) => [cat.name.toLowerCase(), cat.icon])),
    [categories],
  )

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("byCategory.title")}</CardTitle>
          <CardDescription>{t("byCategory.description", { month: monthLabel })}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {report.by_category.map((row) => {
            const visual = categoryVisual(iconByName.get(row.category.toLowerCase()))
            const Icon = visual.icon
            const pct = row.share_percent !== null ? Math.min(100, Math.max(0, Number(row.share_percent))) : 0
            return (
              <div key={row.category} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${visual.tileClass}`}>
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="truncate font-medium">{row.category}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t("byCategory.count", { count: row.count })}
                    </span>
                  </div>
                  <div className="ml-auto flex shrink-0 items-baseline gap-2 tabular-nums">
                    <span className="font-semibold">{formatMoney(row.total, report.currency)}</span>
                    {row.share_percent !== null && (
                      <span className="w-10 text-right text-xs text-muted-foreground">
                        {t("byCategory.share", { percent: row.share_percent })}
                      </span>
                    )}
                  </div>
                </div>
                {row.share_percent !== null && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: visual.chartColor }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{t("byPayment.title")}</CardTitle>
            <CardDescription>{t("byPayment.description", { month: monthLabel })}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5">
            {report.by_payment_method.map((row) => {
              const pct = row.share_percent !== null ? Math.min(100, Math.max(0, Number(row.share_percent))) : 0
              return (
                <div key={row.payment_method} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{labels[row.payment_method]}</span>
                      <Tag className="h-4.5 shrink-0 px-1.5 text-[10px]">
                        {t("byPayment.count", { count: row.count })}
                      </Tag>
                    </div>
                    <div className="ml-auto flex shrink-0 items-baseline gap-2 text-right tabular-nums">
                      <span className="font-semibold">{formatMoney(row.total, report.currency)}</span>
                      {row.share_percent !== null && (
                        <span className="w-10 text-xs text-muted-foreground">
                          {t("byPayment.share", { percent: row.share_percent })}
                        </span>
                      )}
                    </div>
                  </div>
                  {row.share_percent !== null && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-3 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {report.biggest.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("biggest.title")}</CardTitle>
              <CardDescription>{t("biggest.description", { month: monthLabel })}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/70">
              {report.biggest.map((expense, index) => (
                <div
                  key={`${expense.spent_on}-${expense.merchant}-${index}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{expense.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("biggest.categoryAndDate", {
                          category: expense.category,
                          date: formatDate(expense.spent_on),
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatMoney(expense.amount, report.currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
